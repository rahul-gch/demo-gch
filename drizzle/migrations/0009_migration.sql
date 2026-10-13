-- Org members: only owners (or platform admins via separate policy) may create owner memberships.
DROP POLICY IF EXISTS "members insert by managers" ON public.org_members;
CREATE POLICY "members insert by managers" ON public.org_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_can_manage(auth.uid(), org_id)
    AND (role <> 'owner'::public.org_role OR public.user_is_owner(auth.uid(), org_id))
  );

-- Conversation participants: a user may only add rows for organizations they belong to.
DROP POLICY IF EXISTS "participants insert by own org member" ON public.conversation_participants;
CREATE POLICY "participants insert by own org member" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- Project partners: only managers of the project owner organization (or platform admins) may change partner rows/permissions.
DROP POLICY IF EXISTS "partners update by inviter" ON public.project_partners;
CREATE POLICY "partners update by owner managers" ON public.project_partners
  FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_partners.project_id AND public.user_can_manage(auth.uid(), p.owner_org_id))
  )
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_partners.project_id AND public.user_can_manage(auth.uid(), p.owner_org_id))
  );