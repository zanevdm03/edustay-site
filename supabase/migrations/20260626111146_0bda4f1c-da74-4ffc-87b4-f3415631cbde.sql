
DROP POLICY IF EXISTS "Public read property media" ON storage.objects;
CREATE POLICY "Public read property media" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-media');

DROP POLICY IF EXISTS "Admins upload property media" ON storage.objects;
CREATE POLICY "Admins upload property media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update property media" ON storage.objects;
CREATE POLICY "Admins update property media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete property media" ON storage.objects;
CREATE POLICY "Admins delete property media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));
