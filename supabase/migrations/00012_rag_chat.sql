-- ============================================================
-- RAG Chat: switch embeddings to 768-dim, global match function,
-- auto-embedding trigger via pg_net + Vault.
--
-- Pre-conditions:
--   * property_embeddings is empty (no production rows). If not,
--     truncate first or migrate to 1536 + outputDimensionality.
--   * Vault secrets must be set in the dashboard (separate step,
--     not in this migration so secrets are not committed):
--       select vault.create_secret('<edge_fn_url>',  'edge_fn_embed_url');
--       select vault.create_secret('<service_role>', 'edge_fn_service_role');
-- ============================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists vector with schema extensions;

-- ------------------------------------------------------------
-- 1. Ensure property_embeddings exists, then resize to 768 dims.
-- ------------------------------------------------------------
create table if not exists property_embeddings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  embedding extensions.vector(768) not null,
  metadata jsonb,
  created_at timestamptz default now(),
  unique(property_id, chunk_index)
);

create index if not exists idx_property_embeddings_property
  on property_embeddings(property_id);

-- Drop the cosine index (if present) so we can resize / rebuild it.
drop index if exists idx_property_embeddings_vector;

-- Empty any pre-existing rows so the type cast can never fail.
truncate table property_embeddings;

-- No-op when column is already 768; resizes from any other dim otherwise.
alter table property_embeddings
  alter column embedding type extensions.vector(768);

create index idx_property_embeddings_vector
  on property_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

-- ------------------------------------------------------------
-- 2. Property embedding status columns
-- ------------------------------------------------------------
alter table properties
  add column if not exists embedding_status text
    not null default 'pending'
    check (embedding_status in ('pending', 'ready', 'error')),
  add column if not exists embedding_updated_at timestamptz;

create index if not exists idx_properties_embedding_status
  on properties(embedding_status);

-- ------------------------------------------------------------
-- 3. Replace match_property_embeddings(vector(1536), ...) with vector(768)
-- ------------------------------------------------------------
drop function if exists match_property_embeddings(extensions.vector, uuid, float, int);

create or replace function match_property_embeddings(
  query_embedding extensions.vector(768),
  match_property_id uuid,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  property_id uuid,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
set search_path = public, extensions
as $$
  select
    pe.id,
    pe.property_id,
    pe.chunk_index,
    pe.content,
    pe.metadata,
    (1 - (pe.embedding <=> query_embedding))::float as similarity
  from public.property_embeddings pe
  where pe.property_id = match_property_id
    and 1 - (pe.embedding <=> query_embedding) > match_threshold
  order by pe.embedding <=> query_embedding
  limit match_count;
$$;

-- ------------------------------------------------------------
-- 4. Global match function used by chat-search Edge Function
-- ------------------------------------------------------------
create or replace function match_properties_global(
  query_embedding extensions.vector(768),
  match_threshold float default 0.55,
  match_count int default 12
)
returns table (
  property_id uuid,
  max_similarity float,
  top_chunk text
)
language sql stable
set search_path = public, extensions
as $$
  with scored as (
    select
      pe.property_id,
      pe.content,
      (1 - (pe.embedding <=> query_embedding))::float as similarity,
      row_number() over (
        partition by pe.property_id
        order by pe.embedding <=> query_embedding
      ) as rn
    from public.property_embeddings pe
    where 1 - (pe.embedding <=> query_embedding) > match_threshold
  )
  select
    s.property_id,
    s.similarity as max_similarity,
    s.content as top_chunk
  from scored s
  where s.rn = 1
  order by s.similarity desc
  limit match_count;
$$;

-- ------------------------------------------------------------
-- 5. Auto-embedding trigger (calls embed-property Edge Function)
-- ------------------------------------------------------------
create or replace function tg_enqueue_property_embedding()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'edge_fn_embed_url' limit 1;
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'edge_fn_service_role' limit 1;

  -- Skip silently if secrets are not configured (e.g. local/dev).
  if v_url is null or v_key is null then
    return new;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object('property_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_enqueue_property_embedding on properties;

create trigger trg_enqueue_property_embedding
  after insert or update of
    title, description, address, city, state, price,
    bedrooms, bathrooms, has_garage, has_garden,
    building_type, category_id, living_area_sqft, year_built
  on properties
  for each row execute function tg_enqueue_property_embedding();
