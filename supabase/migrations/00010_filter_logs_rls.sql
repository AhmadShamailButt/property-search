-- ============================================================
-- filter_logs RLS + is_admin() helper
--
-- The filter_logs table captures one row per settled search and
-- gets its tapped_property_id updated when the user opens a
-- property card. Policies:
--   * Authenticated users can INSERT a log for themselves
--   * Authenticated users can UPDATE only their own log row
--     (used to attribute a tap)
--   * Only admins can SELECT — analytics screen is admin-only
--
-- Idempotent: drops policies before recreating; CREATE OR REPLACE
-- on the helper function.
-- ============================================================

-- ----------------------------------------------------------------
-- Helper: is_admin(uid) — security-definer so RLS policies can
-- check the current user's role without recursing on profiles RLS.
-- ----------------------------------------------------------------
create or replace function is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.profiles
     where id = uid
       and role = 'admin'
  )
$$;

grant execute on function is_admin(uuid) to authenticated;

-- ----------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------
alter table filter_logs enable row level security;

drop policy if exists "Users insert own filter logs"  on filter_logs;
drop policy if exists "Users update own filter logs"  on filter_logs;
drop policy if exists "Admins read filter logs"       on filter_logs;

create policy "Users insert own filter logs"
  on filter_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own filter logs"
  on filter_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins read filter logs"
  on filter_logs for select
  to authenticated
  using (is_admin(auth.uid()));
