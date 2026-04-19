-- ============================================================
-- Storage Buckets & Policies
-- ============================================================

-- 1. Property Images bucket (public read)
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true);

-- 2. Banner Images bucket (public read)
insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true);

-- 3. User Avatars bucket (public read)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- ============================================================
-- Policies: Public read for all buckets
-- ============================================================

-- Anyone can view property images
create policy "Public read property images"
  on storage.objects for select
  using (bucket_id = 'property-images');

-- Anyone can view banner images
create policy "Public read banner images"
  on storage.objects for select
  using (bucket_id = 'banner-images');

-- Anyone can view avatars
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================
-- Policies: Authenticated upload/update/delete
-- ============================================================

-- Authenticated users can upload property images
create policy "Auth upload property images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images');

-- Authenticated users can update their own property images
create policy "Auth update property images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can delete their own property images
create policy "Auth delete property images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can upload banner images (admin only enforced at app level)
create policy "Auth upload banner images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'banner-images');

-- Authenticated users can update banner images
create policy "Auth update banner images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'banner-images');

-- Authenticated users can delete banner images
create policy "Auth delete banner images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'banner-images');

-- Authenticated users can upload their own avatar
create policy "Auth upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can update their own avatar
create policy "Auth update avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can delete their own avatar
create policy "Auth delete avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
