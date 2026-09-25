ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS orgs_is_hidden_idx ON public.orgs (is_hidden);

CREATE OR REPLACE FUNCTION public.viewer_can_see_hidden_org(_user uuid, _org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_platform_admin(_user)
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = _org AND m.user_id = _user
    )
    OR EXISTS (
      SELECT 1
      FROM public.org_connections c
      JOIN public.org_members m ON m.user_id = _user
      WHERE c.status = 'accepted'
        AND (
          (c.from_org_id = _org AND c.to_org_id = m.org_id)
          OR (c.to_org_id = _org AND c.from_org_id = m.org_id)
        )
    );
$$;

REVOKE ALL ON FUNCTION public.viewer_can_see_hidden_org(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.viewer_can_see_hidden_org(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "orgs readable by authenticated" ON public.orgs;
CREATE POLICY "orgs readable by authenticated"
ON public.orgs
FOR SELECT
TO authenticated
USING (
  is_hidden = false
  OR public.viewer_can_see_hidden_org(auth.uid(), id)
);