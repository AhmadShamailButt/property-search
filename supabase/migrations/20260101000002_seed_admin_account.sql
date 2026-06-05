-- ============================================================
-- 00007: Seed an initial admin account
--
-- Creates one bootstrap admin so the admin tabs (Listings, Users,
-- Banners, Dashboard) can be exercised end-to-end. After this runs,
-- subsequent admins are promoted by an existing admin updating
-- profiles.role from the User Management screen.
--
-- Email:    admin@gmail.com
-- Password: Admin@1234567890
--
-- Change both before exposing the database to anyone outside the
-- dev team. The password hash below is generated with bcrypt at
-- the moment of running this migration via crypt().
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  admin_email text := 'admin@gmail.com';
  admin_password text := 'Admin@1234567890';
  admin_uid uuid;
begin
  -- 1. Reuse the row if it already exists (re-running this migration
  --    against a database where the user was created manually).
  select id into admin_uid from auth.users where email = admin_email;

  if admin_uid is null then
    admin_uid := extensions.gen_random_uuid();

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
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_email,
      extensions.crypt(admin_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', 'Platform Admin'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Supabase requires a matching auth.identities row for password sign-in.
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      extensions.gen_random_uuid(),
      admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', admin_email),
      'email',
      admin_uid::text,
      now(),
      now(),
      now()
    );
  end if;

  -- 2. Ensure the profile row exists and is flagged as admin + active.
  --    The handle_new_user trigger will have inserted the row already
  --    when auth.users was inserted; this UPSERT covers both paths.
  insert into public.profiles (id, full_name, role, is_active, location)
  values (admin_uid, 'Platform Admin', 'admin', true, 'HQ')
  on conflict (id) do update
    set role = 'admin',
        is_active = true,
        full_name = coalesce(nullif(public.profiles.full_name, ''), 'Platform Admin');
end $$;
