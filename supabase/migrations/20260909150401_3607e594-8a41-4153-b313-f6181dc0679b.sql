-- 1. Internal trigger/helper functions should not be callable by app users
REVOKE EXECUTE ON FUNCTION public.log_member_activity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_org_activity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_org_created_by() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_org_operating_countries() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.platform_admin_domains() FROM anon, authenticated;

-- 2. Org banner reads: only real organization branding folders, signed-in users
DROP POLICY IF EXISTS "org-banners read authenticated" ON storage.objects;
CREATE POLICY "org-banners read org branding"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'org-banners'
  AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  AND EXISTS (
    SELECT 1 FROM public.orgs o
    WHERE o.id = ((storage.foldername(name))[1])::uuid
  )
);

-- 3. Project content updates must respect granular partner permissions
DROP POLICY IF EXISTS "discussions update by partners" ON public.project_discussions;
CREATE POLICY "discussions update by permitted members"
ON public.project_discussions FOR UPDATE TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
  OR public.project_permission(auth.uid(), project_id, 'comment')
  OR public.project_permission(auth.uid(), project_id, 'edit')
)
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
  OR public.project_permission(auth.uid(), project_id, 'comment')
  OR public.project_permission(auth.uid(), project_id, 'edit')
);

DROP POLICY IF EXISTS "meetings update by partners" ON public.project_meetings;
CREATE POLICY "meetings update by permitted members"
ON public.project_meetings FOR UPDATE TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
  OR public.project_permission(auth.uid(), project_id, 'edit')
)
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
  OR public.project_permission(auth.uid(), project_id, 'edit')
);

DROP POLICY IF EXISTS "requests update by partners" ON public.project_requests;
CREATE POLICY "requests update by permitted members"
ON public.project_requests FOR UPDATE TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
  OR public.project_permission(auth.uid(), project_id, 'approve')
  OR public.project_permission(auth.uid(), project_id, 'createRequests')
  OR public.project_permission(auth.uid(), project_id, 'comment')
)
WITH CHECK (
  public.is_platform_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
  OR public.project_permission(auth.uid(), project_id, 'approve')
  OR public.project_permission(auth.uid(), project_id, 'createRequests')
  OR public.project_permission(auth.uid(), project_id, 'comment')
);