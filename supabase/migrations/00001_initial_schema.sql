-- ============================================================
-- Property Search App — Initial Schema Migration
-- ============================================================

-- Extensions
create extension if not exists vector;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  role text not null default 'searcher' check (role in ('searcher', 'owner', 'admin')),
  phone text,
  location text default 'New York, USA',
  member_since timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Seed default categories
insert into categories (name, slug, sort_order) values
  ('Villa', 'villa', 1),
  ('Apartment', 'apartment', 2),
  ('House', 'house', 3);

-- ============================================================
-- 3. PROPERTIES
-- ============================================================
create table properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id),
  title text not null,
  description text,
  address text not null,
  city text,
  state text,
  country text default 'USA',
  latitude double precision,
  longitude double precision,
  price numeric(12,2) not null,
  year_built int,
  living_area_sqft numeric(10,2),
  bedrooms int default 0,
  bathrooms int default 0,
  living_rooms int default 0,
  kitchens int default 0,
  has_garage boolean default false,
  has_garden boolean default false,
  building_type text,
  is_featured boolean default false,
  is_active boolean default true,
  ai_score numeric(3,1),
  ai_score_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_properties_category on properties(category_id);
create index idx_properties_owner on properties(owner_id);
create index idx_properties_price on properties(price);
create index idx_properties_featured on properties(is_featured) where is_featured = true;
create index idx_properties_active on properties(is_active) where is_active = true;

-- ============================================================
-- 4. PROPERTY IMAGES
-- ============================================================
create table property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  image_url text not null,
  is_hero boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index idx_property_images_property on property_images(property_id);

-- ============================================================
-- 5. BANNERS
-- ============================================================
create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  is_active boolean default true,
  sort_order int default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. FAVORITES
-- ============================================================
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, property_id)
);

create index idx_favorites_user on favorites(user_id);
create index idx_favorites_property on favorites(property_id);

-- ============================================================
-- 7. CONVERSATIONS
-- ============================================================
create table conversations (
  id uuid primary key default gen_random_uuid(),
  searcher_id uuid not null references profiles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique(searcher_id, owner_id, property_id)
);

create index idx_conversations_searcher on conversations(searcher_id);
create index idx_conversations_owner on conversations(owner_id);

-- ============================================================
-- 8. MESSAGES
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_messages_conversation on messages(conversation_id);
create index idx_messages_sender on messages(sender_id);

-- ============================================================
-- 9. AI CHAT MESSAGES (RAG per property)
-- ============================================================
create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_ai_chat_user_property on ai_chat_messages(user_id, property_id);

-- ============================================================
-- 10. PROPERTY EMBEDDINGS (RAG vector store)
-- ============================================================
create table property_embeddings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  embedding extensions.vector(1536) not null,
  metadata jsonb,
  created_at timestamptz default now(),
  unique(property_id, chunk_index)
);

create index idx_property_embeddings_vector
  on property_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

create index idx_property_embeddings_property
  on property_embeddings(property_id);

-- ============================================================
-- 11. FILTER LOGS (Admin analytics)
-- ============================================================
create table filter_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  filters_applied jsonb not null,
  sort_type text,
  result_count int,
  tapped_property_id uuid references properties(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_filter_logs_created on filter_logs(created_at);
create index idx_filter_logs_user on filter_logs(user_id);

-- ============================================================
-- RAG similarity search function
-- ============================================================
create or replace function match_property_embeddings(
  query_embedding extensions.vector(1536),
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
language plpgsql stable
set search_path = 'public, extensions'
as $$
begin
  return query
  select
    pe.id,
    pe.property_id,
    pe.chunk_index,
    pe.content,
    pe.metadata,
    (1 - (pe.embedding <=> query_embedding))::float as similarity
  from property_embeddings pe
  where pe.property_id = match_property_id
    and 1 - (pe.embedding <=> query_embedding) > match_threshold
  order by pe.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- Auto-create profile on signup trigger
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger set_properties_updated_at
  before update on properties
  for each row execute function update_updated_at();
