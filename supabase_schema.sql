-- ============================================================================
-- TAXI JOHOR CROSS BORDER - SUPABASE DATABASE SCHEMA & MIGRATION SCRIPT
-- ============================================================================
-- Run this script in the Supabase SQL Editor to set up tables, RLS policies,
-- security functions, storage policies, and seed data from fleetData.js.
-- ============================================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'driver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES TABLE (Tied to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'driver',
  avatar_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + INTERVAL '1 year');

-- Index for role lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check user role cleanly without recursive RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- 3. FLEETS TABLE
CREATE TABLE IF NOT EXISTS public.fleets (
  id TEXT PRIMARY KEY,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  driver_name TEXT,
  rate TEXT NOT NULL,
  seats TEXT NOT NULL,
  luggage TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  image_url TEXT NOT NULL,
  gallery_urls TEXT[] DEFAULT '{}'::text[],
  description TEXT,
  direction TEXT NOT NULL DEFAULT 'jb-sg',
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.fleets ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}'::text[];
-- Route direction: 'jb-sg' (Johor -> Singapore) or 'sg-jb' (Singapore -> Johor), used to filter the public fleet list
ALTER TABLE public.fleets ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'jb-sg';
-- One-time correction for the existing reverse-direction car seeded before this column existed
UPDATE public.fleets SET direction = 'sg-jb' WHERE id = 'tnoah-saiful';

-- Main vehicle photo focal point (0-100, matches CSS object-position %), lets a driver
-- pan/crop which part of their photo is visible inside the fixed-aspect-ratio card frame
ALTER TABLE public.fleets ADD COLUMN IF NOT EXISTS image_position_x NUMERIC NOT NULL DEFAULT 50;
ALTER TABLE public.fleets ADD COLUMN IF NOT EXISTS image_position_y NUMERIC NOT NULL DEFAULT 50;

CREATE INDEX IF NOT EXISTS idx_fleets_driver_id ON public.fleets(driver_id);
CREATE INDEX IF NOT EXISTS idx_fleets_published ON public.fleets(is_published);

-- 4. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DESTINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  tag TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('johor', 'singapore')),
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = public.get_user_role(auth.uid())
    AND expires_at = (SELECT p.expires_at FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins full management on profiles" ON public.profiles;
CREATE POLICY "Admins full management on profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- FLEETS RLS
-- Public listing excludes vehicles whose assigned driver's account has expired
-- (unassigned vehicles, i.e. driver_id IS NULL, are unaffected by this and remain governed by is_published alone).
DROP POLICY IF EXISTS "Public read published fleets" ON public.fleets;
CREATE POLICY "Public read published fleets" ON public.fleets
  FOR SELECT USING (
    is_published = true
    AND (
      driver_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = driver_id AND (p.expires_at IS NULL OR p.expires_at > now())
      )
    )
  );

DROP POLICY IF EXISTS "Drivers read own fleet" ON public.fleets;
CREATE POLICY "Drivers read own fleet" ON public.fleets
  FOR SELECT USING (driver_id = auth.uid());

-- Driver-only column locking (is_published, display_order) is enforced by the
-- trg_enforce_driver_fleet_restrictions trigger below instead of a self-referencing
-- RLS subquery -- a correlated subquery back onto "fleets" from within a fleets
-- policy is fragile and previously caused "infinite recursion detected in policy
-- for relation fleets" once a second SELECT-applicable policy existed on this table.
DROP POLICY IF EXISTS "Drivers update own fleet" ON public.fleets;
CREATE POLICY "Drivers update own fleet" ON public.fleets
  FOR UPDATE USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_driver_fleet_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    NEW.is_published := OLD.is_published;
    NEW.display_order := OLD.display_order;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_driver_fleet_restrictions ON public.fleets;
CREATE TRIGGER trg_enforce_driver_fleet_restrictions
  BEFORE UPDATE ON public.fleets
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_driver_fleet_restrictions();

DROP POLICY IF EXISTS "Admins full control fleets" ON public.fleets;
CREATE POLICY "Admins full control fleets" ON public.fleets
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- SERVICES RLS
DROP POLICY IF EXISTS "Public read published services" ON public.services;
CREATE POLICY "Public read published services" ON public.services
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins full control services" ON public.services;
CREATE POLICY "Admins full control services" ON public.services
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- DESTINATIONS RLS
DROP POLICY IF EXISTS "Public read published destinations" ON public.destinations;
CREATE POLICY "Public read published destinations" ON public.destinations
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins full control destinations" ON public.destinations;
CREATE POLICY "Admins full control destinations" ON public.destinations
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- SITE SETTINGS RLS
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins update site_settings" ON public.site_settings;
CREATE POLICY "Admins update site_settings" ON public.site_settings
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');


-- 8. AUTOMATED TRIGGERS

-- Trigger to sync user creation in auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'driver'::public.app_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = COALESCE((new.raw_user_meta_data->>'role')::public.app_role, public.profiles.role, EXCLUDED.role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 9. ADMIN DRIVER PROVISIONING RPC FUNCTIONS

DROP FUNCTION IF EXISTS public.admin_create_driver_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_create_driver_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Allows Admin to create an auto-confirmed driver user account and its first fleet record
CREATE OR REPLACE FUNCTION public.admin_create_driver_user(
  driver_email TEXT,
  driver_password TEXT,
  driver_full_name TEXT,
  driver_phone TEXT,
  car_name TEXT,
  car_seats TEXT,
  car_luggage TEXT,
  car_rate TEXT,
  car_image_url TEXT,
  car_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  slug_base TEXT;
  new_fleet_id TEXT;
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only Admins can provision driver accounts.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(driver_email)) THEN
    RAISE EXCEPTION 'A driver account already exists for %. Use a different email.', LOWER(driver_email);
  END IF;

  slug_base := trim(both '-' from regexp_replace(lower(driver_full_name), '[^a-z0-9]+', '-', 'g'));
  IF slug_base = '' THEN
    slug_base := 'driver';
  END IF;
  new_fleet_id := 'fleet-' || slug_base || '-' || substr(replace(new_user_id::text, '-', ''), 1, 8);

  -- 1. Insert into auth.users (email pre-confirmed)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    LOWER(driver_email), crypt(driver_password, gen_salt('bf', 10)), now(),
    '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', driver_full_name, 'phone_number', driver_phone, 'role', 'driver')::jsonb,
    now(), now()
  );

  -- 2. Insert into auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = new_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), new_user_id, new_user_id::text,
      json_build_object('sub', new_user_id, 'email', LOWER(driver_email))::jsonb,
      'email', now(), now(), now()
    );
  END IF;

  -- 3. Upsert Profile as Driver
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new_user_id, driver_full_name, 'driver')
  ON CONFLICT (id) DO UPDATE SET role = 'driver', full_name = driver_full_name;

  -- 4. Create and link the driver's first vehicle
  INSERT INTO public.fleets (
    id, driver_id, name, driver_name, rate, seats, luggage,
    whatsapp_number, image_url, description, is_published, display_order
  )
  VALUES (
    new_fleet_id, new_user_id, car_name, driver_full_name, car_rate, car_seats, car_luggage,
    driver_phone, car_image_url, car_description, true,
    COALESCE((SELECT MAX(display_order) + 1 FROM public.fleets), 1)
  );

  RETURN jsonb_build_object('driver_id', new_user_id, 'fleet_id', new_fleet_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Allows an Admin user to assign or update a driver's vehicle profile cleanly
CREATE OR REPLACE FUNCTION public.admin_link_driver_fleet(target_driver_id UUID, target_fleet_id TEXT)
RETURNS VOID AS $$
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only Admins can provision driver fleet links.';
  END IF;

  UPDATE public.profiles
  SET role = 'driver'
  WHERE id = target_driver_id;

  UPDATE public.fleets
  SET driver_id = target_driver_id
  WHERE id = target_fleet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allows an Admin user to renew a driver's annual account status (+1 year)
CREATE OR REPLACE FUNCTION public.admin_renew_driver(target_driver_id UUID, extend_months INT DEFAULT 12)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  new_expiration TIMESTAMPTZ;
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only Admins can renew driver accounts.';
  END IF;

  UPDATE public.profiles
  SET expires_at = CASE
        WHEN expires_at > timezone('utc'::text, now()) THEN expires_at + (extend_months || ' months')::INTERVAL
        ELSE timezone('utc'::text, now()) + (extend_months || ' months')::INTERVAL
      END,
      updated_at = timezone('utc'::text, now())
  WHERE id = target_driver_id
  RETURNING expires_at INTO new_expiration;

  RETURN new_expiration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allows an Admin user to permanently delete a driver account and associated fleet
CREATE OR REPLACE FUNCTION public.admin_delete_driver(target_driver_id UUID)
RETURNS VOID AS $$
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only Admins can delete driver accounts.';
  END IF;

  -- 1. Remove fleet vehicles linked to driver
  DELETE FROM public.fleets WHERE driver_id = target_driver_id;

  -- 2. Remove profile record
  DELETE FROM public.profiles WHERE id = target_driver_id;

  -- 3. Remove auth identities and user account
  DELETE FROM auth.identities WHERE user_id = target_driver_id;
  DELETE FROM auth.users WHERE id = target_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Allows an Admin user to reset a driver's login password to a new temporary one
CREATE OR REPLACE FUNCTION public.admin_reset_driver_password(target_driver_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only Admins can reset driver passwords.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = target_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Allows an Admin to create a driver login and attach it to an EXISTING vehicle
-- (preserving that vehicle's photo/rate/specs), instead of always creating a new one.
CREATE OR REPLACE FUNCTION public.admin_provision_driver_for_fleet(
  driver_email TEXT,
  driver_password TEXT,
  driver_full_name TEXT,
  driver_phone TEXT,
  target_fleet_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  IF public.get_user_role(auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only Admins can provision driver accounts.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(driver_email)) THEN
    RAISE EXCEPTION 'A driver account already exists for %. Use a different email.', LOWER(driver_email);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.fleets WHERE id = target_fleet_id) THEN
    RAISE EXCEPTION 'No vehicle found with id %.', target_fleet_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.fleets WHERE id = target_fleet_id AND driver_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Vehicle % already has a linked driver account.', target_fleet_id;
  END IF;

  -- 1. Insert into auth.users (email pre-confirmed)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    LOWER(driver_email), crypt(driver_password, gen_salt('bf', 10)), now(),
    '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', driver_full_name, 'phone_number', driver_phone, 'role', 'driver')::jsonb,
    now(), now()
  );

  -- 2. Insert into auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = new_user_id) THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), new_user_id, new_user_id::text,
      json_build_object('sub', new_user_id, 'email', LOWER(driver_email))::jsonb,
      'email', now(), now(), now()
    );
  END IF;

  -- 3. Upsert Profile as Driver
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new_user_id, driver_full_name, 'driver')
  ON CONFLICT (id) DO UPDATE SET role = 'driver', full_name = driver_full_name;

  -- 4. Link the driver to the existing vehicle, preserving its photo/rate/specs
  UPDATE public.fleets
  SET driver_id = new_user_id,
      driver_name = driver_full_name,
      whatsapp_number = driver_phone,
      updated_at = now()
  WHERE id = target_fleet_id;

  RETURN jsonb_build_object('driver_id', new_user_id, 'fleet_id', target_fleet_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;



-- 10. STORAGE BUCKET CONFIGURATION & RLS POLICIES
-- Create storage bucket 'fleet-media' if it does not exist
-- file_size_limit/allowed_mime_types are enforced by Storage itself on every upload,
-- so this can't be bypassed even by a crafted API call that skips the app's own UI.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fleet-media', 'fleet-media', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Intentionally no public SELECT policy on storage.objects for this bucket.
-- The bucket is created with `public = true`, which already serves individual
-- file contents at /storage/v1/object/public/fleet-media/<path> to anyone,
-- regardless of storage.objects RLS -- that's how the website displays photos.
-- A permissive SELECT policy here would additionally let any client (including
-- anonymous ones) call storage.list()/query storage.objects to enumerate every
-- filename in the bucket, which the app never needs (it only ever references
-- images by their already-known public URL). Listing/managing files remains
-- available to drivers for their own folder and to admins for everything via
-- the "Drivers update delete own media" FOR ALL policy below.
DROP POLICY IF EXISTS "Public media read" ON storage.objects;

-- Driver upload to own folder / fleets
-- Scoped to paths containing the caller's own uid (e.g. fleets/<uid>/.., fleets/gallery/<uid>/..);
-- admins keep unrestricted access (e.g. for fleets/new-drivers/.. during provisioning).
DROP POLICY IF EXISTS "Drivers upload own media" ON storage.objects;
CREATE POLICY "Drivers upload own media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fleet-media' AND
    auth.role() = 'authenticated' AND
    (
      public.get_user_role(auth.uid()) = 'admin'
      OR auth.uid()::text = ANY(storage.foldername(name))
    )
  );

DROP POLICY IF EXISTS "Drivers update delete own media" ON storage.objects;
CREATE POLICY "Drivers update delete own media" ON storage.objects
  FOR ALL USING (
    bucket_id = 'fleet-media' AND
    auth.role() = 'authenticated' AND
    (
      public.get_user_role(auth.uid()) = 'admin'
      OR auth.uid()::text = ANY(storage.foldername(name))
    )
  )
  WITH CHECK (
    bucket_id = 'fleet-media' AND
    auth.role() = 'authenticated' AND
    (
      public.get_user_role(auth.uid()) = 'admin'
      OR auth.uid()::text = ANY(storage.foldername(name))
    )
  );


-- ============================================================================
-- 11. SEED DATA FROM fleetData.js
-- ============================================================================

-- Site Settings Seed
INSERT INTO public.site_settings (key, value) VALUES
  ('DEFAULT_WHATSAPP_NUMBER', '60127942974')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Fleets Seed
INSERT INTO public.fleets (id, name, driver_name, rate, seats, luggage, whatsapp_number, image_url, display_order, is_published) VALUES
  ('tinnova-kawan', 'Toyota Innova', 'Mr. YY', 'SGD 120 per trip', '4 Seater', '4 large bags', '60127942974', '/images/fleet/toyotainnovayy.jpeg', 1, true),
  ('ppersona', 'Proton Persona', 'Mr. Azwan', 'SGD 100 per trip', '4 Seater', '2 large bags', '60189094047', '/images/fleet/protonpersona2.jpeg', 2, true),
  ('tinnova-elmee', 'Toyota Innova', 'Mr. Elmee', 'SGD 120 per trip', '4 Seater', '4 large bags', '60106656136', '/images/fleet/toyotainnovaelmees.jpeg', 3, true),
  ('tinnova-kawan2', 'Toyota Innova', 'Mr.Khamisan', 'SGD 120 per trip', '4 Seater', '4 large bags', '60127531753', '/images/fleet/toyotainnovakhamisan.jpeg', 4, true),
  ('pexoramalik', 'Proton Exora', 'Mr.Malik', 'SGD 120 per trip', '4 Seater', '4 large bags', '601117615585', '/images/fleet/protonexoramalik.jpeg', 5, true),
  ('tinnova-yb', 'Toyota Innova', 'Mr.YB', 'SGD 120 per trip', '4 Seater', '4 large bags', '60142494247', '/images/fleet/toyotainnovayb.jpeg', 6, true),
  ('tnoah-saiful', 'Toyota Noah (Singapore to Johor)', 'Mr.Saiful', 'SGD 140 per trip', '6 Seater', '4 large bags', '6588599366', '/images/fleet/toyotanoahsaiful.jpeg', 7, true),
  ('pexoraman', 'Proton Exora', 'Mr. Man', 'SGD 120 per trip', '4 Seater', '4 large bags', '60177614385', '/images/fleet/vellfiretaximan2.jpeg', 8, true),
  ('tinnova-razali', 'Toyota Innova', 'Mr. Razali', 'SGD 120 per trip', '4 Seater', '4 large bags', '601137433099', '/images/fleet/toyotainnovapa.jpeg', 9, true),
  ('tinnova-samtino', 'Toyota Innova', 'Mr. Samtino', 'SGD 120 per trip', '4 Seater', '4 large bags', '601116177393', '/images/fleet/toyotainnovasamtino.jpeg', 10, true),
  ('psagavvt', 'Proton Saga VVT', 'Mr. Alfah', 'SGD 100 per trip', '4 Seater', '4 large bags', '60127486709', '/images/fleet/protonsagavvt.jpeg', 11, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  driver_name = EXCLUDED.driver_name,
  rate = EXCLUDED.rate,
  seats = EXCLUDED.seats,
  luggage = EXCLUDED.luggage,
  whatsapp_number = EXCLUDED.whatsapp_number,
  image_url = EXCLUDED.image_url;

-- Services Seed
INSERT INTO public.services (id, title, description, image_url, display_order, is_published) VALUES
  ('airport', 'AIRPORT TRANSFER', 'Seamless transfers for Changi Airport (SG), Senai International Airport (JHB) & Seletar Airport.', 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80', 1, true),
  ('corporate', 'CORPORATE JOB', '5-star executive transport for business meetings, cross-border corporate events & VIP clients.', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80', 2, true),
  ('tour', 'PRIVATE TOUR', 'Customized day tours to top attractions across Singapore and Johor with comfortable private rides.', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 3, true),
  ('outstation', 'OUTSTATION TRIP', 'Long-distance transfers to Desaru, Malacca, Genting Highlands, Mersing Jetty & beyond.', '/images/fleet/vellfiretaximan.jpeg', 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- Destinations Seed (Johor & Singapore)
INSERT INTO public.destinations (id, name, location, tag, category, image_url, display_order, is_published) VALUES
  -- Johor
  ('legoland', 'Legoland Malaysia & Sea Life', 'Iskandar Puteri, Johor', 'Theme Park', 'johor', '/images/destinations/legoland.png', 1, true),
  ('desaru', 'Desaru Coast & Waterpark', 'Kota Tinggi, Johor', 'Beach Resort', 'johor', '/images/destinations/desaru.png', 2, true),
  ('jpo', 'Johor Premium Outlets (JPO)', 'Kulai, Johor', 'Shopping', 'johor', '/images/destinations/jpo.png', 3, true),
  ('jbcity', 'JB City Square & KSL City', 'Johor Bahru City', 'City & Shopping', 'johor', '/images/destinations/jbcity.png', 4, true),
  ('mersing', 'Mersing Jetty (Tioman Gateway)', 'Mersing, Johor', 'Island Gateway', 'johor', '/images/destinations/mersing.png', 5, true),
  ('senai', 'Senai International Airport (JHB)', 'Senai, Johor', 'Airport', 'johor', '/images/destinations/senai.png', 6, true),
  -- Singapore
  ('changi', 'Changi Airport & Jewel', 'Changi, Singapore', 'Airport & Transit', 'singapore', '/images/destinations/changi.png', 1, true),
  ('mbs', 'Marina Bay Sands & Gardens by the Bay', 'Marina Bay, Singapore', 'Iconic Landmark', 'singapore', '/images/destinations/mbs.png', 2, true),
  ('sentosa', 'Resorts World Sentosa & USS', 'Sentosa Island, Singapore', 'Theme Park & Resort', 'singapore', '/images/destinations/sentosa.png', 3, true),
  ('orchard', 'Orchard Road Shopping Belt', 'Orchard, Singapore', 'Shopping & Dining', 'singapore', '/images/destinations/orchard.png', 4, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  tag = EXCLUDED.tag,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url;

-- ============================================================================
-- 12. AUTOMATED SEED: ADMIN & DRIVER TEST ACCOUNTS
-- ============================================================================
-- Seeding pre-configured Test Accounts in Supabase Auth & Profiles tables:
-- Admin:  admin@taxijohor.com  | Password: Password123!
-- Driver: driver@taxijohor.com | Password: Password123!

DO $$
DECLARE
  admin_uid  UUID;
  driver_uid UUID;
BEGIN
  UPDATE auth.users
  SET confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      email_change = COALESCE(email_change, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, '')
  WHERE LOWER(email) IN ('admin@taxijohor.com', 'driver@taxijohor.com');

  -- 1. Get or Create Admin User in auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE LOWER(email) = 'admin@taxijohor.com' LIMIT 1;

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new,
      email_change_token_current, email_change, phone_change, phone_change_token,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@taxijohor.com', crypt('Password123!', gen_salt('bf', 10)), now(),
      '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}', '{"full_name":"System Administrator","role":"admin"}', now(), now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Password123!', gen_salt('bf', 10)),
        email_confirmed_at = now(),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        email_change = COALESCE(email_change, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        raw_user_meta_data = json_build_object('full_name', 'System Administrator', 'role', 'admin')::jsonb,
        updated_at = now()
    WHERE id = admin_uid;
  END IF;

  -- Ensure Admin Identity
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_uid) THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(), admin_uid, admin_uid::text,
      json_build_object('sub', admin_uid, 'email', 'admin@taxijohor.com')::jsonb,
      'email', now(), now(), now()
    );
  END IF;

  -- Ensure Admin Profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (admin_uid, 'System Administrator', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'System Administrator';


  -- 2. Clean & Recreate Driver User in auth.users & auth.identities
  -- Delete any corrupted/orphan identity records causing HTTP 500 in GoTrue
  DELETE FROM auth.identities
  WHERE provider_id = 'driver@taxijohor.com'
     OR identity_data->>'email' = 'driver@taxijohor.com'
     OR user_id IN (SELECT id FROM auth.users WHERE LOWER(email) = 'driver@taxijohor.com');
  DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE LOWER(email) = 'driver@taxijohor.com');
  DELETE FROM auth.users WHERE LOWER(email) = 'driver@taxijohor.com';

  driver_uid := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    driver_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'driver@taxijohor.com', crypt('Password123!', gen_salt('bf', 10)), now(),
    '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}', '{"full_name":"Mr. Razali","role":"driver"}', now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), driver_uid, driver_uid::text,
    json_build_object('sub', driver_uid, 'email', 'driver@taxijohor.com')::jsonb,
    'email', now(), now(), now()
  );

  INSERT INTO public.profiles (id, full_name, role)
  VALUES (driver_uid, 'Mr. Razali', 'driver')
  ON CONFLICT (id) DO UPDATE SET role = 'driver', full_name = 'Mr. Razali';

  UPDATE public.fleets
  SET driver_id = driver_uid
  WHERE id = 'tinnova-razali';

END $$;
