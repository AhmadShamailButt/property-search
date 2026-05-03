-- ============================================================
-- Home Screen: RLS policies + seed data
-- Tables touched: categories, banners, properties, property_images, favorites
-- Existing schema (00001) is left untouched. This migration only
-- enables RLS on the home-related tables and inserts demo content.
-- All inserts are idempotent.
-- ============================================================

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
alter table categories       enable row level security;
alter table banners          enable row level security;
alter table properties       enable row level security;
alter table property_images  enable row level security;
alter table favorites        enable row level security;

-- Public browse policies (anon + authenticated can read)
drop policy if exists "Public read categories" on categories;
create policy "Public read categories"
  on categories for select
  using (is_active = true);

drop policy if exists "Public read banners" on banners;
create policy "Public read banners"
  on banners for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >  now())
  );

drop policy if exists "Public read properties" on properties;
create policy "Public read properties"
  on properties for select
  using (is_active = true);

drop policy if exists "Public read property images" on property_images;
create policy "Public read property images"
  on property_images for select
  using (true);

-- Owner write policies (so listing creation/edit still works elsewhere in the app)
drop policy if exists "Owner manages properties" on properties;
create policy "Owner manages properties"
  on properties for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owner manages property images" on property_images;
create policy "Owner manages property images"
  on property_images for all
  to authenticated
  using (
    exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid())
  );

-- Favorites: each user manages their own
drop policy if exists "Users read own favorites"   on favorites;
drop policy if exists "Users insert own favorites" on favorites;
drop policy if exists "Users delete own favorites" on favorites;

create policy "Users read own favorites"
  on favorites for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own favorites"
  on favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own favorites"
  on favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Demo owner (auth user + profile) for seeded listings
-- ----------------------------------------------------------------
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_anonymous
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo-owner@property-search.local',
  crypt('demo-pw-not-used', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Property Search Co"}'::jsonb,
  now(),
  now(),
  false
)
on conflict (id) do nothing;

insert into profiles (id, full_name, role)
values ('11111111-1111-1111-1111-111111111111', 'Property Search Co', 'owner')
on conflict (id) do update set role = 'owner';

-- ----------------------------------------------------------------
-- Banners
-- ----------------------------------------------------------------
insert into banners (id, title, subtitle, image_url, link_url, is_active, sort_order) values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'Find your dream home today',
   'Get 10% off closing costs on featured houses',
   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
   null, true, 1),
  ('aaaaaaaa-0000-0000-0000-000000000002',
   'Modern villas, curated',
   'Hand-picked architectural gems near you',
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
   null, true, 2),
  ('aaaaaaaa-0000-0000-0000-000000000003',
   'List with us, sell faster',
   'Reach thousands of buyers in your city',
   'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
   null, true, 3)
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- Properties + hero images
-- ----------------------------------------------------------------
do $$
declare
  villa_id uuid;
  apt_id   uuid;
  house_id uuid;
  owner_const constant uuid := '11111111-1111-1111-1111-111111111111';
begin
  select id into villa_id from categories where slug = 'villa';
  select id into apt_id   from categories where slug = 'apartment';
  select id into house_id from categories where slug = 'house';

  insert into properties (id, owner_id, category_id, title, address, city, state, country,
                          latitude, longitude, price, bedrooms, bathrooms, is_featured, is_active)
  values
  -- Los Angeles
  ('bbbbbbbb-0000-0000-0000-000000000001', owner_const, villa_id, 'Modern Glass Villa',
   '124 Beverly Hills, CA', 'Los Angeles', 'CA', 'USA', 34.0901, -118.4065, 4500000, 5, 6, true,  true),
  ('bbbbbbbb-0000-0000-0000-000000000002', owner_const, apt_id,   'Sunset Skyline Loft',
   '780 W Sunset Blvd',     'Los Angeles', 'CA', 'USA', 34.0903, -118.2614, 1200000, 2, 2, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000003', owner_const, house_id, 'Hillcrest Family Home',
   '92 Hillcrest Dr',        'Los Angeles', 'CA', 'USA', 34.0823, -118.3441, 2150000, 4, 3, true,  true),
  -- New York
  ('bbbbbbbb-0000-0000-0000-000000000004', owner_const, apt_id,   'Minimalist NoHo Apartment',
   '89 Bond St',             'New York',    'NY', 'USA', 40.7269, -73.9928, 1850000, 2, 2, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000005', owner_const, apt_id,   'Brooklyn Heights Studio',
   '125 Remsen St',          'New York',    'NY', 'USA', 40.6953, -73.9964,  750000, 1, 1, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000006', owner_const, house_id, 'Park Slope Brownstone',
   '450 1st St',             'New York',    'NY', 'USA', 40.6720, -73.9810, 3200000, 4, 3, true,  true),
  -- Miami
  ('bbbbbbbb-0000-0000-0000-000000000007', owner_const, villa_id, 'Oceanfront Villa',
   '5500 Collins Ave',       'Miami',       'FL', 'USA', 25.8189, -80.1227, 6800000, 6, 7, true,  true),
  ('bbbbbbbb-0000-0000-0000-000000000008', owner_const, apt_id,   'Brickell High-Rise',
   '1080 Brickell Ave',      'Miami',       'FL', 'USA', 25.7657, -80.1918,  920000, 2, 2, false, true),
  -- San Francisco
  ('bbbbbbbb-0000-0000-0000-000000000009', owner_const, house_id, 'Painted Lady Townhouse',
   '722 Steiner St',         'San Francisco','CA', 'USA', 37.7762, -122.4324, 2950000, 3, 3, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000010', owner_const, villa_id, 'Pacific Heights Estate',
   '2900 Broadway',          'San Francisco','CA', 'USA', 37.7935, -122.4399, 8500000, 6, 8, true,  true),
  -- Austin
  ('bbbbbbbb-0000-0000-0000-000000000011', owner_const, house_id, 'Hill Country Home',
   '4700 Mt Bonnell Rd',     'Austin',      'TX', 'USA', 30.3217, -97.7733, 1450000, 4, 3, false, true),
  ('bbbbbbbb-0000-0000-0000-000000000012', owner_const, apt_id,   'Downtown ATX Loft',
   '301 Brazos St',          'Austin',      'TX', 'USA', 30.2681, -97.7426,  685000, 1, 2, false, true)
  on conflict (id) do nothing;

  -- Hero images (one per property; only insert if no hero exists yet)
  insert into property_images (property_id, image_url, is_hero, sort_order)
  select v.property_id, v.image_url, true, 0
  from (values
    ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000003'::uuid, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000004'::uuid, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000005'::uuid, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000006'::uuid, 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000007'::uuid, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000008'::uuid, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000009'::uuid, 'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000010'::uuid, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000011'::uuid, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'),
    ('bbbbbbbb-0000-0000-0000-000000000012'::uuid, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80')
  ) as v(property_id, image_url)
  where not exists (
    select 1 from property_images pi
    where pi.property_id = v.property_id and pi.is_hero = true
  );
end $$;
