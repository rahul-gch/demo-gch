-- 1. orgs: restrict SELECT to authenticated (was open to anon/public, exposing contacts)
DROP POLICY IF EXISTS "orgs readable by all" ON public.orgs;
CREATE POLICY "orgs readable by authenticated" ON public.orgs
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.orgs TO authenticated;
REVOKE SELECT ON public.orgs FROM anon;

-- 2. helper: is_project_member = member of owner org OR any partner org (SECURITY DEFINER, no RLS recursion)
CREATE OR REPLACE FUNCTION public.is_project_member(_user uuid, _project uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project AND public.is_org_member(_user, p.owner_org_id)
  ) OR public.is_project_partner(_user, _project)
$$;

-- 3. projects: scope SELECT to project members + platform admins
DROP POLICY IF EXISTS "projects readable by authenticated" ON public.projects;
CREATE POLICY "projects readable by members" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), id));

-- 4. project_partners
DROP POLICY IF EXISTS "partners readable by authenticated" ON public.project_partners;
CREATE POLICY "partners readable by members" ON public.project_partners
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 5. project_requests
DROP POLICY IF EXISTS "requests readable by authenticated" ON public.project_requests;
CREATE POLICY "requests readable by members" ON public.project_requests
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 6. project_documents
DROP POLICY IF EXISTS "documents readable by authenticated" ON public.project_documents;
CREATE POLICY "documents readable by members" ON public.project_documents
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 7. project_discussions
DROP POLICY IF EXISTS "discussions readable by authenticated" ON public.project_discussions;
CREATE POLICY "discussions readable by members" ON public.project_discussions
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 8. project_meetings
DROP POLICY IF EXISTS "meetings readable by authenticated" ON public.project_meetings;
CREATE POLICY "meetings readable by members" ON public.project_meetings
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 9. project_activity
DROP POLICY IF EXISTS "activity readable by authenticated" ON public.project_activity;
CREATE POLICY "activity readable by members" ON public.project_activity
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_project_member(auth.uid(), project_id));

-- 10. reports bucket: scope read + insert to org members (first path segment = org id)
DROP POLICY IF EXISTS "reports read authenticated" ON storage.objects;
CREATE POLICY "reports read by org members" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reports' AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid));

DROP POLICY IF EXISTS "reports insert authenticated" ON storage.objects;
CREATE POLICY "reports insert by org members" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid));
