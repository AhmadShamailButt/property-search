-- ============================================================
-- 00008: Update bootstrap admin credentials
--
-- 00007 seeded an admin at admin@propertysearch.local. This
-- migration changes the email to admin@gmail.com and resets the
-- password to Admin@1234567890. Idempotent — safe to re-run.
-- ============================================================

do $$
declare
  old_email text := 'admin@propertysearch.local';
  new_email text := 'admin@gmail.com';
  new_password text := 'Admin@1234567890';
  admin_uid uuid;
begin
  -- Locate the existing admin: prefer the new email if the row was
  -- already renamed, fall back to the original seed email.
  select id into admin_uid from auth.users where email = new_email;
  if admin_uid is null then
    select id into admin_uid from auth.users where email = old_email;
  end if;

  if admin_uid is null then
    raise notice 'No bootstrap admin row found (looked for % and %). Run 00007 first.', new_email, old_email;
    return;
  end if;

  update auth.users
  set
    email = new_email,
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where id = admin_uid;

  -- Keep auth.identities in sync so password sign-in resolves the
  -- new email back to this user.
  update auth.identities
  set
    identity_data = jsonb_build_object('sub', admin_uid::text, 'email', new_email),
    provider_id = admin_uid::text,
    updated_at = now()
  where user_id = admin_uid and provider = 'email';
end $$;
