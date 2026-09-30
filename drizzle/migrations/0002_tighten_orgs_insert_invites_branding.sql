DROP POLICY IF EXISTS "orgs insert by authenticated" ON public.orgs;
CREATE POLICY "orgs insert by authenticated" ON public.orgs
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "invites insert by org managers" ON public.org_invites;
CREATE POLICY "invites insert by org managers" ON public.org_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_can_manage(auth.uid(), org_id)
    AND invited_by = auth.uid()
    AND (role <> 'owner' OR public.user_is_owner(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "org-banners read org branding" ON storage.objects;
CREATE POLICY "org-banners read org branding" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'org-banners'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.is_network_user(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.orgs o
      WHERE o.id = ((storage.foldername(objects.name))[1])::uuid
        AND (o.is_hidden = false OR public.viewer_can_see_hidden_org(auth.uid(), o.id))
    )
  );

DROP POLICY IF EXISTS "org-logos public read" ON storage.objects;
CREATE POLICY "org-logos network read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND public.is_network_user(auth.uid())
  );