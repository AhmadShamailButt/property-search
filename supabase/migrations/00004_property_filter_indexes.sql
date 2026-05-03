-- ============================================================
-- Indexes to support filter queries on the search screen
-- ============================================================

create index if not exists idx_properties_bedrooms on properties(bedrooms);
create index if not exists idx_properties_bathrooms on properties(bathrooms);
create index if not exists idx_properties_living_area on properties(living_area_sqft);
create index if not exists idx_properties_created_at on properties(created_at desc);
