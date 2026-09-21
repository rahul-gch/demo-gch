DROP POLICY IF EXISTS "conversations readable by participants" ON public.conversations;
CREATE POLICY "conversations readable by participants"
ON public.conversations FOR SELECT
USING (public.is_conversation_participant(auth.uid(), id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "participants readable by participants" ON public.conversation_participants;
CREATE POLICY "participants readable by participants"
ON public.conversation_participants FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "messages readable by participants" ON public.messages;
CREATE POLICY "messages readable by participants"
ON public.messages FOR SELECT
USING (public.is_conversation_participant(auth.uid(), conversation_id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "meetings readable by both orgs" ON public.meeting_requests;
CREATE POLICY "meetings readable by both orgs"
ON public.meeting_requests FOR SELECT
USING (
  public.is_org_member(auth.uid(), requester_org_id)
  OR public.is_org_member(auth.uid(), recipient_org_id)
  OR public.is_platform_admin(auth.uid())
);