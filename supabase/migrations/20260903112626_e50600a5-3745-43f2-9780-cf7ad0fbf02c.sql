-- Guard the UUID cast on the reports bucket policies so a non-UUID folder
-- (e.g. a slug) is denied instead of raising an input syntax error.
DROP POLICY IF EXISTS "reports read by org members" ON storage.objects;
CREATE POLICY "reports read by org members" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "reports insert by org members" ON storage.objects;
CREATE POLICY "reports insert by org members" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );