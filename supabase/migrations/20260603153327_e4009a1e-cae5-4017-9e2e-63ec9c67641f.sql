
CREATE POLICY "reports read authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'reports');
CREATE POLICY "reports insert authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reports');
CREATE POLICY "reports delete own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'reports' AND owner = auth.uid());
