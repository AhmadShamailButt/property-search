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
You will be given a user requirement and a list of candidate
properties retrieved by vector search. Recommend ONLY from the
provided properties — never invent listings, prices, or details.
Reference each suggestion by a short label (e.g. "the Austin 3-bed villa")
that matches the title or city. If the user's intent is broad or unclear,
ask one short clarifying question instead of guessing. Keep replies under
120 words. Output plain text only — no markdown formatting of any kind:
no **bold**, no *italics*, no backticks, no bullet lists, no headings,
no property IDs or JSON. Just a friendly conversational paragraph.
`.trim();

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: { message?: string; history?: ChatHistory; limit?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const message = (body.message ?? "").trim();
  if (!message) return json({ error: "message required" }, 400);

  const history = Array.isArray(body.history) ? body.history : [];
  const limit = Math.max(1, Math.min(body.limit ?? 6, 12));

  try {
    const queryEmbedding = await embedText(message, "RETRIEVAL_QUERY");

    const { data: matches, error: rpcErr } = await supabase.rpc(
      "match_properties_global",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.45,
        match_count: 12,
      },
    );
    if (rpcErr) throw new Error(`rpc match failed: ${rpcErr.message}`);

    const matchRows = (matches ?? []) as Array<{
      property_id: string;
      max_similarity: number;
      top_chunk: string;
    }>;
    const ids = matchRows.slice(0, limit).map((m) => m.property_id);

    let properties: PropertyRow[] = [];
    if (ids.length > 0) {
      const { data: rows, error: fetchErr } = await supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .in("id", ids)
        .eq("is_active", true);
      if (fetchErr) throw new Error(`fetch properties failed: ${fetchErr.message}`);

      // Re-order by similarity rank (Postgres .in() does not preserve order).
      const order = new Map(ids.map((id, i) => [id, i] as const));
      properties = ((rows ?? []) as unknown as PropertyRow[]).sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
    }

    const contextBlocks = properties.map(buildContextBlock);

    let reply: string;
    if (properties.length === 0) {
      reply = `I couldn't find any listings matching that yet. Could you tell me a bit more — city, budget, bedrooms, or property type?`;
    } else {
      reply = await generateChat(SYSTEM_PROMPT, message, contextBlocks, history);
      if (!reply) {
        reply = `I found ${properties.length} ${
          properties.length === 1 ? "listing" : "listings"
        } that look close to what you described — take a look below.`;
      }
    }

    return json({ reply, properties });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
