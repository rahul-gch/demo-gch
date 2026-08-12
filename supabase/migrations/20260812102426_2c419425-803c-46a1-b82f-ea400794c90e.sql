DROP POLICY IF EXISTS "org-banners read authenticated" ON storage.objects;
CREATE POLICY "org-banners read authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'org-banners');

DROP POLICY IF EXISTS "org-banners insert by managers" ON storage.objects;
CREATE POLICY "org-banners insert by managers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-banners'
    AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org-banners update by managers" ON storage.objects;
CREATE POLICY "org-banners update by managers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-banners'
    AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org-banners delete by managers" ON storage.objects;
CREATE POLICY "org-banners delete by managers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-banners'
    AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );