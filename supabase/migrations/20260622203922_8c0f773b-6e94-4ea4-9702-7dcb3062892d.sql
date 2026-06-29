
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles policies
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New-user trigger: create profile + default student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read properties" ON public.properties
  FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER properties_set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Units
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.units TO anon, authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read units" ON public.units
  FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER units_set_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  monthly_price NUMERIC(10,2),
  features TEXT[] NOT NULL DEFAULT '{}',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  walkthrough_video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read rooms" ON public.rooms
  FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER rooms_set_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Viewing requests
CREATE TYPE public.viewing_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE public.viewing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  preferred_date TIMESTAMPTZ NOT NULL,
  status public.viewing_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.viewing_requests TO authenticated;
GRANT ALL ON public.viewing_requests TO service_role;
ALTER TABLE public.viewing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own requests" ON public.viewing_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students create own requests" ON public.viewing_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update requests" ON public.viewing_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER viewing_requests_set_updated_at
  BEFORE UPDATE ON public.viewing_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sample data
WITH p AS (
  INSERT INTO public.properties (name, location, description, cover_image_url, features)
  VALUES (
    'Edu Heights',
    'Bloemfontein',
    'Modern student residence within walking distance of UFS, secure access, fibre WiFi and study lounges.',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
    ARRAY['24/7 Security', 'Fibre WiFi', 'Backup Power', 'Study Lounge', 'Parking']
  ) RETURNING id
), u1 AS (
  INSERT INTO public.units (property_id, name, description)
  SELECT id, 'Unit A', 'Ground-floor 4-bedroom unit with shared kitchen and lounge.' FROM p
  RETURNING id
), u2 AS (
  INSERT INTO public.units (property_id, name, description)
  SELECT id, 'Unit B', 'First-floor 3-bedroom unit with balcony.' FROM p
  RETURNING id
)
INSERT INTO public.rooms (unit_id, name, is_occupied, monthly_price, features, image_urls)
SELECT id, 'Room 1', false, 4500, ARRAY['Single bed','Built-in desk','Wardrobe'],
       ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200']
FROM u1
UNION ALL
SELECT id, 'Room 2', true,  4500, ARRAY['Single bed','Built-in desk','Wardrobe'], ARRAY[]::TEXT[] FROM u1
UNION ALL
SELECT id, 'Room 3', false, 4800, ARRAY['Double bed','Desk','Wardrobe'],
       ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200']
FROM u1
UNION ALL
SELECT id, 'Room 4', false, 4500, ARRAY['Single bed','Desk'], ARRAY[]::TEXT[] FROM u1
UNION ALL
SELECT id, 'Room 1', false, 5000, ARRAY['Double bed','Balcony access','Desk'],
       ARRAY['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200']
FROM u2
UNION ALL
SELECT id, 'Room 2', true,  4700, ARRAY['Single bed','Desk'], ARRAY[]::TEXT[] FROM u2
UNION ALL
SELECT id, 'Room 3', false, 4700, ARRAY['Single bed','Desk','Wardrobe'], ARRAY[]::TEXT[] FROM u2;
