
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS near_cut boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS near_ufs boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS water_electricity boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wifi boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_cameras boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_options text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'any';

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS room_type text NOT NULL DEFAULT 'single';

DROP POLICY IF EXISTS "Admins manage properties" ON public.properties;
CREATE POLICY "Admins manage properties" ON public.properties
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage units" ON public.units;
CREATE POLICY "Admins manage units" ON public.units
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage rooms" ON public.rooms;
CREATE POLICY "Admins manage rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
