// embed-property: builds a content string from a property row,
// generates a Vertex AI embedding, replaces the rows in
// property_embeddings, and updates properties.embedding_status.
//
// Service-role gated: caller must present the project's
// service-role key as Bearer (the Postgres trigger and admin
// scripts use it). Never call this directly from the app.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { embedText } from "../_shared/vertex.ts";

type PropertyRow = {
  id: string;
  title: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  price: number | null;
  year_built: number | null;
  living_area_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  living_rooms: number | null;
  kitchens: number | null;
  has_garage: boolean | null;
  has_garden: boolean | null;
  building_type: string | null;
  categories: { name: string } | { name: string }[] | null;
};

const PROPERTY_SELECT = `
  id, title, description, address, city, state, country, price,
  year_built, living_area_sqft, bedrooms, bathrooms, living_rooms,
  kitchens, has_garage, has_garden, building_type,
  categories(name)
`;

const MAX_CONTENT_LEN = 6000;

function categoryName(p: PropertyRow): string {
  if (!p.categories) return "";
  if (Array.isArray(p.categories)) return p.categories[0]?.name ?? "";
  return p.categories.name ?? "";
}

function buildContent(p: PropertyRow): string {
  const parts: string[] = [];
  if (p.title) parts.push(`Title: ${p.title}`);
  const cat = categoryName(p);
  if (cat) parts.push(`Category: ${cat}`);
  if (p.building_type) parts.push(`Building type: ${p.building_type}`);
  const addr = [p.address, p.city, p.state, p.country].filter(Boolean).join(", ");
  if (addr) parts.push(`Address: ${addr}`);
  if (p.price != null) parts.push(`Price: $${Math.round(p.price).toLocaleString("en-US")}`);
  if (p.bedrooms != null) parts.push(`Bedrooms: ${p.bedrooms}`);
  if (p.bathrooms != null) parts.push(`Bathrooms: ${p.bathrooms}`);
  if (p.living_rooms != null) parts.push(`Living rooms: ${p.living_rooms}`);
  if (p.kitchens != null) parts.push(`Kitchens: ${p.kitchens}`);
  if (p.year_built != null) parts.push(`Year built: ${p.year_built}`);
  if (p.living_area_sqft != null) parts.push(`Living area: ${p.living_area_sqft} sqft`);
  if (p.has_garage != null) parts.push(`Garage: ${p.has_garage ? "yes" : "no"}`);
  if (p.has_garden != null) parts.push(`Garden: ${p.has_garden ? "yes" : "no"}`);
  if (p.description) parts.push(`Description: ${p.description}`);
  return parts.join("\n").slice(0, MAX_CONTENT_LEN);
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // Internal-only gate. We use a dedicated shared secret (not the
  // service-role key) so we don't depend on header-rewrite quirks.
  const internal = req.headers.get("x-internal-secret") ?? "";
  if (!INTERNAL_SECRET || internal !== INTERNAL_SECRET) {
    return json({ error: "forbidden" }, 403);
  }

  let body: { property_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const propertyId = body.property_id;
  if (!propertyId) return json({ error: "property_id required" }, 400);

  // Mark pending.
  await supabase
    .from("properties")
    .update({ embedding_status: "pending" })
    .eq("id", propertyId);

  try {
    const { data: prop, error: fetchErr } = await supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("id", propertyId)
      .single<PropertyRow>();
    if (fetchErr || !prop) {
      throw new Error(`fetch property failed: ${fetchErr?.message ?? "not found"}`);
    }

    const content = buildContent(prop);
    if (!content) throw new Error("empty content");

    const embedding = await embedText(content, "RETRIEVAL_DOCUMENT");

    const { error: delErr } = await supabase
      .from("property_embeddings")
      .delete()
      .eq("property_id", propertyId);
    if (delErr) throw new Error(`delete embeddings failed: ${delErr.message}`);

    const { error: insErr } = await supabase
      .from("property_embeddings")
      .insert({
        property_id: propertyId,
        chunk_index: 0,
        content,
        embedding,
        metadata: { model: "gemini-embedding-001", task: "RETRIEVAL_DOCUMENT" },
      });
    if (insErr) throw new Error(`insert embedding failed: ${insErr.message}`);

    await supabase
      .from("properties")
      .update({
        embedding_status: "ready",
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId);

    return json({ ok: true, property_id: propertyId });
  } catch (err) {
    await supabase
      .from("properties")
      .update({ embedding_status: "error" })
      .eq("id", propertyId);
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
