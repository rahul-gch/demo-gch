-- Enterprise RBAC (Role-Based Access Control) & Row-Level Security Migration
-- Defines the complete hierarchy: Owner > Admin > Editor > Viewer + Platform Admin

-- 1. Platform Admin Helper Function
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF _user IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Is Organization Owner Helper Function
CREATE OR REPLACE FUNCTION public.is_org_owner(_user UUID, _org UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF _user IS NULL OR _org IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.is_platform_admin(_user) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.orgs WHERE id = _org AND created_by = _user) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user AND org_id = _org AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Can Manage Helper Function (Owner, Admin, Platform Admin)
CREATE OR REPLACE FUNCTION public.user_can_manage(_user UUID, _org UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF _user IS NULL OR _org IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.is_platform_admin(_user) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.orgs WHERE id = _org AND created_by = _user) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user AND org_id = _org
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Can Edit Helper Function (Owner, Admin, Editor, Platform Admin, Org Creator)
CREATE OR REPLACE FUNCTION public.user_can_edit(_user UUID, _org UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF _user IS NULL OR _org IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.is_platform_admin(_user) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.orgs WHERE id = _org AND created_by = _user) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user AND org_id = _org
    AND role IN ('owner', 'admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Can View Helper Function (Owner, Admin, Editor, Viewer, Platform Admin)
CREATE OR REPLACE FUNCTION public.user_can_view(_user UUID, _org UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF _user IS NULL OR _org IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.is_platform_admin(_user) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.orgs WHERE id = _org AND created_by = _user) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user AND org_id = _org
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 6. Apply Unified RLS Policies
-- -----------------------------------------------------------------------------

-- Projects Table Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects select for members and partners" ON public.projects;
DROP POLICY IF EXISTS "projects insert by org editors" ON public.projects;
DROP POLICY IF EXISTS "projects update by org managers or creators" ON public.projects;
DROP POLICY IF EXISTS "projects delete by org managers" ON public.projects;

CREATE POLICY "projects select for members and partners"
ON public.projects
FOR SELECT
TO authenticated
USING (
  public.user_can_view(auth.uid(), owner_org_id)
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_partners pp
    JOIN public.org_members om ON om.org_id = pp.org_id
    WHERE pp.project_id = public.projects.id AND om.user_id = auth.uid()
  )
);

CREATE POLICY "projects insert by org editors"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  (public.user_can_edit(auth.uid(), owner_org_id) OR public.is_platform_admin(auth.uid()))
  AND created_by = auth.uid()
);

CREATE POLICY "projects update by org managers or creators"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  public.user_can_edit(auth.uid(), owner_org_id)
  OR created_by = auth.uid()
)
WITH CHECK (
  public.user_can_edit(auth.uid(), owner_org_id)
  OR created_by = auth.uid()
);

CREATE POLICY "projects delete by org managers"
ON public.projects
FOR DELETE
TO authenticated
USING (
  public.user_can_manage(auth.uid(), owner_org_id)
  OR created_by = auth.uid()
);

-- Project Partners Policies
ALTER TABLE public.project_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners select" ON public.project_partners;
DROP POLICY IF EXISTS "partners insert" ON public.project_partners;
DROP POLICY IF EXISTS "partners update" ON public.project_partners;
DROP POLICY IF EXISTS "partners delete" ON public.project_partners;

CREATE POLICY "partners select"
ON public.project_partners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = public.project_partners.project_id
    AND (
      public.user_can_view(auth.uid(), p.owner_org_id)
      OR p.created_by = auth.uid()
      OR public.user_can_view(auth.uid(), public.project_partners.org_id)
    )
  )
);

CREATE POLICY "partners insert"
ON public.project_partners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = public.project_partners.project_id
    AND (
      public.user_can_edit(auth.uid(), p.owner_org_id)
      OR p.created_by = auth.uid()
      OR public.is_platform_admin(auth.uid())
    )
  )
);

CREATE POLICY "partners update"
ON public.project_partners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = public.project_partners.project_id
    AND (
      public.user_can_manage(auth.uid(), p.owner_org_id)
      OR p.created_by = auth.uid()
      OR public.user_can_manage(auth.uid(), public.project_partners.org_id)
    )
  )
);

CREATE POLICY "partners delete"
ON public.project_partners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = public.project_partners.project_id
    AND (
      public.user_can_manage(auth.uid(), p.owner_org_id)
      OR p.created_by = auth.uid()
    )
  )
);

-- Project Activity Policies
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity select" ON public.project_activity;
DROP POLICY IF EXISTS "activity insert" ON public.project_activity;

CREATE POLICY "activity select"
ON public.project_activity
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = public.project_activity.project_id
    AND (
      public.user_can_view(auth.uid(), p.owner_org_id)
      OR p.created_by = auth.uid()
    )
  )
);

CREATE POLICY "activity insert"
ON public.project_activity
FOR INSERT
TO authenticated
WITH CHECK (
  actor_user_id = auth.uid()
  OR public.is_platform_admin(auth.uid())
);
