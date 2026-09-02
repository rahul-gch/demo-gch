DROP POLICY IF EXISTS "projects readable by members" ON public.projects;
CREATE POLICY "projects readable by members" ON public.projects
FOR SELECT TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR public.is_org_member(auth.uid(), owner_org_id)
  OR public.is_project_partner(auth.uid(), id)
);
DELETE FROM public.projects WHERE name = 'probe' AND owner_org_id = '3b85de28-c147-494a-9a05-f5ff07601423' AND description = '';