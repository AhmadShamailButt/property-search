// chat-search: takes a free-text user requirement, embeds it,
// runs vector search across property_embeddings via the
// match_properties_global RPC, fetches the matched property
// rows in the home-card shape, and asks Gemini to write a short
// reply grounded in the matches. Returns { reply, properties }.
//
// Anon-callable via supabase.functions.invoke from the app.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { embedText, generateChat, type ChatHistory } from "../_shared/vertex.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const PROPERTY_SELECT = `
  id, title, address, city, state, price, bedrooms, bathrooms, is_featured,
  categories ( name ),
  property_images ( image_url, is_hero, sort_order )
`;

const SYSTEM_PROMPT = `
You are a property-search assistant for a real-estate app.
Every turn you receive: (1) the user's message, (2) the prior conversation,
and (3) a "Relevant properties" block listing the only properties you may
recommend this turn. Recommend ONLY from that block — never invent listings,
prices, or details, and never mention properties from earlier turns unless
they also appear in the current block.

If the user references "these", "those", "the above", "from the list", or
similar, treat the current "Relevant properties" block as the set they
meant — it has been reconstructed from the prior turn for you.

Reference each suggestion by a short label (e.g. "the Austin 3-bed villa")
that matches the title or city. If intent is broad or unclear, ask one
short clarifying question instead of guessing. Keep replies under 120
words. Output plain text only — no markdown formatting of any kind: no
**bold**, no *italics*, no backticks, no bullet lists, no headings, no
property IDs or JSON. Just a friendly conversational paragraph.
`.trim();

const FOLLOWUP_PATTERNS = [
  /\b(above|these|those|that one|that list|from (the )?(list|above|results|options|properties|ones))\b/i,
  /\bwhich (one|of (them|these|those))\b/i,
  /\b(cheapest|cheaper|most expensive|biggest|smallest|largest|nearest|closest)\b/i,
  /\bthe (first|second|third|last) one\b/i,
];

function lastAssistantPropertyIds(history: ChatHistory): string[] | null {
  const prior = history.findLast(
    (h) => h.role === "assistant" && (h.property_ids?.length ?? 0) > 0,
  );
  return prior?.property_ids ?? null;
}

function followUpIds(message: string, history: ChatHistory): string[] | null {
  if (!FOLLOWUP_PATTERNS.some((re) => re.test(message))) return null;
  return lastAssistantPropertyIds(history);
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

type PropertyRow = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  is_featured: boolean | null;
  categories: { name: string } | { name: string }[] | null;
  property_images:
    | { image_url: string; is_hero: boolean | null; sort_order: number | null }[]
    | null;
};

function buildContextBlock(p: PropertyRow, idx: number): string {
  const cat = Array.isArray(p.categories)
    ? p.categories[0]?.name
    : p.categories?.name;
  const where = [p.city, p.state].filter(Boolean).join(", ");
  const bits: string[] = [];
  bits.push(`Property ${idx + 1}: ${p.title}`);
  if (cat) bits.push(`type: ${cat}`);
  if (where) bits.push(`location: ${where}`);
  bits.push(`price: $${Math.round(p.price).toLocaleString("en-US")}`);
  if (p.bedrooms != null) bits.push(`${p.bedrooms}BR`);
  if (p.bathrooms != null) bits.push(`${p.bathrooms}BA`);
  if (p.address) bits.push(`address: ${p.address}`);
  return bits.join(" | ");
}

// Structured one-line JSON logs — easy to filter in the Supabase logs UI.
// Every line carries a request id so a single user message can be traced from
// entry to reply.
function log(reqId: string, event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ fn: "chat-search", reqId, event, ...data }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const reqId = crypto.randomUUID().slice(0, 8);
  const t0 = Date.now();

  let body: { message?: string; history?: ChatHistory; limit?: number };
  try {
    body = await req.json();
  } catch {
    log(reqId, "bad_json");
    return json({ error: "invalid json" }, 400);
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    log(reqId, "empty_message");
    return json({ error: "message required" }, 400);
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const limit = Math.max(1, Math.min(body.limit ?? 6, 12));

  log(reqId, "request", {
    message,
    historyLen: history.length,
    historyRoles: history.map((h) => h.role),
    historyPriorIdCounts: history.map((h) => h.property_ids?.length ?? 0),
    limit,
  });

  try {
    let ids: string[];

    const followUp = followUpIds(message, history);
    if (followUp) {
      ids = followUp.slice(0, limit);
      log(reqId, "retrieval_followup", {
        priorIds: followUp,
        usedIds: ids,
      });
    } else {
      const recentUser = history
        .filter((h) => h.role === "user")
        .slice(-3)
        .map((h) => h.text)
        .join("\n");
      const retrievalText = recentUser ? `${recentUser}\n${message}` : message;

      log(reqId, "retrieval_fresh_query", {
        retrievalText,
        recentUserTurnCount: recentUser ? recentUser.split("\n").length : 0,
      });

      const tEmbed = Date.now();
      const queryEmbedding = await embedText(retrievalText, "RETRIEVAL_QUERY");
      log(reqId, "embedded", { ms: Date.now() - tEmbed, dims: queryEmbedding.length });

      const tRpc = Date.now();
      const { data: matches, error: rpcErr } = await supabase.rpc(
        "match_properties_global",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.45,
          match_count: 12,
        },
      );
      if (rpcErr) {
        log(reqId, "rpc_error", { error: rpcErr.message });
        throw new Error(`rpc match failed: ${rpcErr.message}`);
      }

      const matchRows = (matches ?? []) as Array<{
        property_id: string;
        max_similarity: number;
        top_chunk: string;
      }>;
      ids = matchRows.slice(0, limit).map((m) => m.property_id);
      log(reqId, "rpc_matches", {
        ms: Date.now() - tRpc,
        rawCount: matchRows.length,
        usedIds: ids,
        similarities: matchRows.slice(0, limit).map((m) => Number(m.max_similarity.toFixed(4))),
      });
    }

    let properties: PropertyRow[] = [];
    if (ids.length > 0) {
      const { data: rows, error: fetchErr } = await supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .in("id", ids)
        .eq("is_active", true);
      if (fetchErr) {
        log(reqId, "fetch_error", { error: fetchErr.message });
        throw new Error(`fetch properties failed: ${fetchErr.message}`);
      }

      // Re-order by similarity rank (Postgres .in() does not preserve order).
      const order = new Map(ids.map((id, i) => [id, i] as const));
      properties = ((rows ?? []) as unknown as PropertyRow[]).sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );

      log(reqId, "properties_fetched", {
        requestedIds: ids,
        returnedIds: properties.map((p) => p.id),
        droppedIds: ids.filter((id) => !properties.find((p) => p.id === id)),
      });
    }

    const contextBlocks = properties.map(buildContextBlock);

    let reply: string;
    if (properties.length === 0) {
      reply = `I couldn't find any listings matching that yet. Could you tell me a bit more — city, budget, bedrooms, or property type?`;
      log(reqId, "no_matches_fallback");
    } else {
      const tLlm = Date.now();
      try {
        reply = await generateChat(SYSTEM_PROMPT, message, contextBlocks, history);
        log(reqId, "llm_reply", {
          ms: Date.now() - tLlm,
          replyLen: reply?.length ?? 0,
          replyPreview: reply?.slice(0, 200),
        });
      } catch (llmErr) {
        // Vertex 429 / transient failure: still ship the cards we found —
        // they're the useful half of the answer. Substitute a canned reply
        // so the client doesn't show a hard error.
        const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
        log(reqId, "llm_error_fallback", { ms: Date.now() - tLlm, error: msg });
        reply = "";
      }
      if (!reply) {
        reply = `Here ${properties.length === 1 ? "is" : "are"} ${properties.length} ${
          properties.length === 1 ? "listing" : "listings"
        } that look close to what you described — take a look below.`;
      }
    }

    log(reqId, "response", {
      totalMs: Date.now() - t0,
      propertyCount: properties.length,
      propertyIds: properties.map((p) => p.id),
    });
    return json({ reply, properties });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(reqId, "error", { error: msg, totalMs: Date.now() - t0 });
    return json({ error: msg }, 500);
  }
});
