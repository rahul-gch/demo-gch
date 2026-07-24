
-- 1. logo_url column
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Allow authenticated users to create orgs
CREATE POLICY "orgs insert by authenticated"
  ON public.orgs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Allow bootstrap: a user may insert themselves as owner of an org
--    that currently has zero members.
CREATE POLICY "members bootstrap first owner"
  ON public.org_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND NOT EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = org_members.org_id)
  );

-- 4. Storage policies for org-logos bucket
-- Public read (bucket is private but anyone with the object URL can read)
CREATE POLICY "org-logos public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'org-logos');

-- Insert: authenticated user must be a manager of the org identified by
-- the first path segment (org_id). Also allow the very first upload
-- during org creation when no members exist yet.
CREATE POLICY "org-logos insert by managers or bootstrap"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND (
      public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR NOT EXISTS (
        SELECT 1 FROM public.org_members m
        WHERE m.org_id = ((storage.foldername(name))[1])::uuid
      )
    )
  );

CREATE POLICY "org-logos update by managers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "org-logos delete by managers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
