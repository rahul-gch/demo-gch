-- Hidden organizations must not be discoverable through the direct Supabase API.
-- Keep public directory access for visible organizations, while allowing an
-- organization's own members, platform admins, and connected organizations to
-- access rows needed by the private relationship flow.
DROP POLICY IF EXISTS "orgs readable by authenticated" ON public.orgs;

CREATE POLICY "orgs readable by visibility and relationship"
  ON public.orgs
  FOR SELECT
  TO authenticated
  USING (
    is_hidden = false
    OR public.is_platform_admin(auth.uid())
    OR public.is_org_member(auth.uid(), id)
    OR EXISTS (
      SELECT 1
      FROM public.org_members viewer_membership
      WHERE viewer_membership.user_id = auth.uid()
        AND public.orgs_are_connected(viewer_membership.org_id, public.orgs.id)
    )
  );
