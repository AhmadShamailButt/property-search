-- Drop unused latitude/longitude columns from `properties`.
--
-- The Location tab + MapPreview were removed from the property detail screen
-- and the lat/lng inputs were removed from the admin PropertyForm. Nothing in
-- the app reads or writes these columns anymore, so they're safe to drop.

alter table public.properties drop column if exists latitude;
alter table public.properties drop column if exists longitude;
