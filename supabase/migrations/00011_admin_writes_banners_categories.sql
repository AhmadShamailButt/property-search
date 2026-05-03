-- ============================================================
-- Admin write policies for banners + categories
--
-- 00006 enabled RLS and added public-read policies on these tables
-- but no INSERT/UPDATE/DELETE policies — meaning the admin app could
-- not create or edit promotional banners or rename categories.
-- This migration uses the existing `is_admin(uuid)` helper from
-- 00010 to gate writes to admins only.
--
-- Idempotent: drops policies before recreating.
-- ============================================================

-- ----------------------------------------------------------------
-- Banners
-- ----------------------------------------------------------------
drop policy if exists "Admins manage banners" on banners;

create policy "Admins manage banners"
  on banners for all
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- Categories
-- ----------------------------------------------------------------
drop policy if exists "Admins manage categories" on categories;

create policy "Admins manage categories"
  on categories for all
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ----------------------------------------------------------------
-- Storage: tighten banner-image writes to admins only.
-- 00002 allowed any authenticated user to upload/update/delete in
-- the banner-images bucket (gated at app level only). Now that we
-- have an is_admin() helper, we can enforce it at the storage layer.
-- ----------------------------------------------------------------
drop policy if exists "Auth upload banner images"  on storage.objects;
drop policy if exists "Auth update banner images"  on storage.objects;
drop policy if exists "Auth delete banner images"  on storage.objects;
drop policy if exists "Admins upload banner images" on storage.objects;
drop policy if exists "Admins update banner images" on storage.objects;
drop policy if exists "Admins delete banner images" on storage.objects;

create policy "Admins upload banner images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'banner-images' and is_admin(auth.uid()));

create policy "Admins update banner images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'banner-images' and is_admin(auth.uid()));

create policy "Admins delete banner images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'banner-images' and is_admin(auth.uid()));
