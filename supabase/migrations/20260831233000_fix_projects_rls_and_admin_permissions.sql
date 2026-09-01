-- Fix Projects RLS policies and include platform admins in user_can_edit / user_can_manage

-- 1. Update user_can_edit to grant platform admins edit access
CREATE OR REPLACE FUNCTION public.user_can_edit(_user uuid, _org uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_admin(_user) OR public.user_org_role(_user, _org) IN ('owner', 'admin', 'editor')
$$;

-- 2. Update user_can_manage to grant platform admins manage access
CREATE OR REPLACE FUNCTION public.user_can_manage(_user uuid, _org uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_platform_admin(_user) OR public.user_org_role(_user, _org) IN ('owner', 'admin')
$$;

-- 3. Update projects INSERT policy
DROP POLICY IF EXISTS "projects insert by org editors" ON public.projects;
CREATE POLICY "projects insert by org editors" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_platform_admin(auth.uid()) OR public.user_can_edit(auth.uid(), owner_org_id))
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- 4. Update project_partners INSERT policy
DROP POLICY IF EXISTS "partners insert by inviter or owner" ON public.project_partners;
CREATE POLICY "partners insert by inviter or owner" ON public.project_partners
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR public.project_permission(auth.uid(), project_id, 'invite')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.user_can_edit(auth.uid(), p.owner_org_id)
    )
  );

-- 5. Update project_activity INSERT policy
DROP POLICY IF EXISTS "activity insert by partners" ON public.project_activity;
CREATE POLICY "activity insert by partners" ON public.project_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR public.is_project_partner(auth.uid(), project_id)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.user_can_edit(auth.uid(), p.owner_org_id)
    )
  );
