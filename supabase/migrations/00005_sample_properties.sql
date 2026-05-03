-- ============================================================
-- Sample property data for development / search testing.
-- Idempotent: skips inserts if any active properties already exist.
-- Requires at least one row in profiles. If none exists, a
-- synthetic auth.users + profiles row is created as the owner.
-- ============================================================

do $$
declare
  v_owner_id uuid;
  v_villa uuid;
  v_apartment uuid;
  v_house uuid;
  v_property_id uuid;
begin
  if exists (select 1 from properties where is_active = true) then
    raise notice 'Properties already seeded — skipping.';
    return;
  end if;

  select id into v_owner_id from profiles order by created_at limit 1;

  if v_owner_id is null then
    v_owner_id := gen_random_uuid();

    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values (
      v_owner_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'seed-owner@example.com',
      crypt('seed-password', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Seed Owner"}'::jsonb
    );

    insert into profiles (id, full_name, role, location)
    values (v_owner_id, 'Seed Owner', 'owner', 'Los Angeles, CA')
    on conflict (id) do nothing;
  end if;

  select id into v_villa from categories where slug = 'villa';
  select id into v_apartment from categories where slug = 'apartment';
  select id into v_house from categories where slug = 'house';

  -- 1
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_villa, 'Modern Glass Villa', 'Light-filled glass villa overlooking the canyon.', '124 Beverly Hills, CA', 'Los Angeles', 'CA', 4500000, 2021, 6200, 5, 4, true, true, true);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 2
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, is_featured)
  values (v_property_id, v_owner_id, v_apartment, 'Minimalist Loft Apartment', 'Open-plan loft with skyline views.', '89 NYC, New York', 'New York', 'NY', 1200000, 2018, 1450, 2, 2, false, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 3
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_house, 'Suburban Family House', 'Spacious family home with landscaped garden.', '742 Evergreen Terrace', 'Springfield', 'IL', 685000, 2010, 2800, 4, 3, true, true, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 4
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_villa, 'Mediterranean Hilltop Villa', 'Terracotta-roofed villa with infinity pool.', '12 Cliffside Drive', 'Malibu', 'CA', 7800000, 2019, 8200, 6, 5, true, true, true);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 5
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, is_featured)
  values (v_property_id, v_owner_id, v_apartment, 'Downtown Studio', 'Compact studio in the heart of downtown.', '210 Market St', 'San Francisco', 'CA', 549000, 2016, 520, 1, 1, false, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 6
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_house, 'Craftsman Bungalow', 'Restored craftsman with original details.', '54 Oak Lane', 'Portland', 'OR', 875000, 1925, 2100, 3, 2, true, true, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 7
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, is_featured)
  values (v_property_id, v_owner_id, v_apartment, 'Penthouse Skyline Suite', 'Top-floor penthouse with 360° views.', '1 Park Tower', 'Chicago', 'IL', 3250000, 2022, 3400, 3, 3, true, true);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 8
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_house, 'Modern Farmhouse', 'White-on-white farmhouse with wraparound porch.', '320 Country Rd', 'Austin', 'TX', 1150000, 2020, 3600, 4, 3, true, true, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 9
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, is_featured)
  values (v_property_id, v_owner_id, v_villa, 'Coastal Beach Villa', 'Steps from the sand with private deck.', '7 Ocean View', 'Santa Monica', 'CA', 5400000, 2017, 5200, 4, 4, true, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 10
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, is_featured)
  values (v_property_id, v_owner_id, v_apartment, 'Brownstone Garden Apartment', 'Garden-level unit in a historic brownstone.', '45 Brooklyn Ave', 'Brooklyn', 'NY', 925000, 1908, 1100, 2, 1, false, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 11
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_house, 'Mountain Retreat Cabin', 'A-frame cabin tucked in the pines.', '98 Pine Ridge', 'Aspen', 'CO', 1450000, 2015, 1900, 3, 2, true, true, true);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

  -- 12
  v_property_id := gen_random_uuid();
  insert into properties (id, owner_id, category_id, title, description, address, city, state, price, year_built, living_area_sqft, bedrooms, bathrooms, has_garage, has_garden, is_featured)
  values (v_property_id, v_owner_id, v_villa, 'Desert Modern Villa', 'Concrete-and-glass villa with pool and views.', '15 Desert Rose Pl', 'Scottsdale', 'AZ', 2900000, 2021, 4400, 4, 3, true, true, false);
  insert into property_images (property_id, image_url, is_hero, sort_order) values
    (v_property_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true, 0);

end $$;
