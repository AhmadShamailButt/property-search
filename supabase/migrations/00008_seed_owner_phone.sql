-- ============================================================
-- Seed owner contact data
-- 00005_sample_properties.sql creates a single demo owner
-- (auth.users.email = 'seed-owner@example.com') that owns all
-- 12 sample properties. Backfill a phone number on that profile so
-- the property detail "Call owner" CTA has something to dial.
--
-- Idempotent: runs harmlessly if the seed owner doesn't exist.
-- ============================================================

update profiles
   set phone = '+15551234567'
 where id in (
   select id from auth.users where email = 'seed-owner@example.com'
 )
 and (phone is null or phone = '');

-- Bonus: any other owner-role profiles missing a phone get a
-- demo number too, so newly-created listings during local testing
-- also work end-to-end.
update profiles
   set phone = '+15557654321'
 where role = 'owner'
   and (phone is null or phone = '')
   and id not in (
     select id from auth.users where email = 'seed-owner@example.com'
   );
