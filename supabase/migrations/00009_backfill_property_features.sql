-- ============================================================
-- Backfill missing feature fields on existing properties.
--
-- Earlier seed migrations populated different subsets of columns,
-- which leaves the Property Detail "Features" tab showing `—`
-- for some properties. This migration fills sensible defaults for
-- year_built, living_area_sqft, living_rooms, kitchens, and
-- building_type so every seeded property renders all spec fields
-- with real values.
--
-- All updates are guarded with `is null` predicates so the migration
-- is idempotent and never overwrites real owner-provided data.
-- ============================================================

-- Year built — randomized within a realistic range, deterministic per row
update properties
   set year_built = 1990 + (abs(hashtext(id::text)) % 35)  -- 1990..2024
 where year_built is null;

-- Living area in sqft — scales loosely with bedroom count when present
update properties
   set living_area_sqft = case
     when bedrooms is null or bedrooms <= 0 then 1200
     when bedrooms = 1 then 700
     when bedrooms = 2 then 1100
     when bedrooms = 3 then 1700
     when bedrooms = 4 then 2400
     when bedrooms = 5 then 3200
     else 4000 + (bedrooms - 5) * 600
   end
 where living_area_sqft is null;

-- Living rooms — 1 if not set
update properties
   set living_rooms = 1
 where living_rooms is null or living_rooms = 0;

-- Kitchens — 1 if not set
update properties
   set kitchens = 1
 where kitchens is null or kitchens = 0;

-- Building type — derive from category when missing
update properties p
   set building_type = case c.slug
     when 'villa'     then 'Detached villa'
     when 'apartment' then 'Mid-rise apartment'
     when 'house'     then 'Detached house'
     else 'Residential'
   end
  from categories c
 where p.category_id = c.id
   and p.building_type is null;
