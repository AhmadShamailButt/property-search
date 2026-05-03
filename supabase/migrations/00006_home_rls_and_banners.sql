-- ============================================================
-- Home Screen: RLS policies + banner seed
-- Tables touched: categories, banners, properties, property_images, favorites
--
-- Properties / property_images / demo owner are seeded by
-- 00005_sample_properties.sql — this migration only adds the
-- access-control layer and the banner content the home screen
-- carousel needs.
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

-- Owners manage their own listings (does not affect search/home reads)
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

-- Each user manages only their own favorites
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
-- Banner seed (used by the home screen auto-scrolling carousel)
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
