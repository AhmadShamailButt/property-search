-- ============================================================
-- 00006: Profiles RLS + admin helpers
--
-- Goals:
--   1. Admins can view and update every profile (for User Management).
--   2. Non-admin users can read all profiles (public-by-design — owner
--      profiles must be browsable by searchers viewing a listing) but
--      can only update their own row.
--   3. is_active is the soft-delete / deactivation switch admins use.
-- ============================================================

-- A SECURITY DEFINER helper avoids recursive policy evaluation when
-- a policy on `profiles` itself needs to ask "is the caller an admin?".
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- Lock down profiles. Without this, the anon key gives full access.
alter table public.profiles enable row level security;

-- Anyone signed in can read profiles (owner cards on listings, etc.).
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- Users update their own row; admins update any row.
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Inserts only happen via the auth signup trigger / service role.
-- No insert policy = no client-side inserts.

-- Only admins may delete; in practice we soft-delete via is_active.
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- ============================================================
-- Properties + property_images + categories: writeable by owners and admins
-- ============================================================
alter table public.categories enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
  on public.categories for select
  to authenticated, anon
  using (true);

drop policy if exists "properties_select_active_or_owner_or_admin" on public.properties;
create policy "properties_select_active_or_owner_or_admin"
  on public.properties for select
  to authenticated, anon
  using (
    is_active
    or auth.uid() = owner_id
    or public.is_admin(auth.uid())
  );

drop policy if exists "properties_insert_owner_or_admin" on public.properties;
create policy "properties_insert_owner_or_admin"
  on public.properties for insert
  to authenticated
  with check (auth.uid() = owner_id or public.is_admin(auth.uid()));

drop policy if exists "properties_update_owner_or_admin" on public.properties;
create policy "properties_update_owner_or_admin"
  on public.properties for update
  to authenticated
  using (auth.uid() = owner_id or public.is_admin(auth.uid()))
  with check (auth.uid() = owner_id or public.is_admin(auth.uid()));

drop policy if exists "properties_delete_owner_or_admin" on public.properties;
create policy "properties_delete_owner_or_admin"
  on public.properties for delete
  to authenticated
  using (auth.uid() = owner_id or public.is_admin(auth.uid()));

-- property_images: piggyback on the parent property's ownership.
drop policy if exists "property_images_select_all" on public.property_images;
create policy "property_images_select_all"
  on public.property_images for select
  to authenticated, anon
  using (true);

drop policy if exists "property_images_write_owner_or_admin" on public.property_images;
create policy "property_images_write_owner_or_admin"
  on public.property_images for all
  to authenticated
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );
