DROP POLICY IF EXISTS "partners delete by inviter" ON public.project_partners;
CREATE POLICY "partners delete by inviter or owner managers" ON public.project_partners
  FOR DELETE TO authenticated USING (
    public.project_permission(auth.uid(), project_id, 'invite')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_partners.project_id
        AND public.user_can_manage(auth.uid(), p.owner_org_id)
    )
  );