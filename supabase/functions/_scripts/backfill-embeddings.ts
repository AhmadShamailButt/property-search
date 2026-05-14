// One-shot backfill: invoke embed-property for every property
// whose embedding_status is not 'ready'.
//
// Usage:
//   export EXPO_PUBLIC_SUPABASE_URL=...
//   export SUPABASE_SERVICE_ROLE_KEY=...
//   deno run --allow-net --allow-env supabase/functions/_scripts/backfill-embeddings.ts
//
// (No relation to Edge Function deploy — this is a local Deno script.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const URL = Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET");

if (!URL || !SERVICE_ROLE || !INTERNAL_SECRET) {
  console.error(
    "Set EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and INTERNAL_SECRET first.",
  );
  Deno.exit(1);
}

const FN_URL = `${URL.replace(/\/$/, "")}/functions/v1/embed-property`;
const CONCURRENCY = 5;
const MAX_RETRIES = 2;

const supabase = createClient(URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function invokeOnce(propertyId: string): Promise<void> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SERVICE_ROLE}`,
          "x-internal-secret": INTERNAL_SECRET!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ property_id: propertyId }),
      });
      if (res.ok) return;
      lastErr = new Error(`HTTP ${res.status}: ${await res.text()}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  throw lastErr;
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let i = 0;
  let ok = 0;
  let fail = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const idx = i++;
        const item = items[idx];
        try {
          await worker(item);
          ok++;
          console.log(`  [${ok + fail}/${items.length}] ok: ${item}`);
        } catch (err) {
          fail++;
          console.warn(`  [${ok + fail}/${items.length}] fail: ${item}`, err);
        }
      }
    }),
  );
  return { ok, fail };
}

async function main() {
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .neq("embedding_status", "ready");
  if (error) {
    console.error("query failed:", error.message);
    Deno.exit(1);
  }
  const ids = (data ?? []).map((r) => r.id as string);
  console.log(`Found ${ids.length} properties to embed.`);
  if (ids.length === 0) return;

  const { ok, fail } = await runPool(ids, invokeOnce);
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  if (fail > 0) Deno.exit(2);
}

await main();
