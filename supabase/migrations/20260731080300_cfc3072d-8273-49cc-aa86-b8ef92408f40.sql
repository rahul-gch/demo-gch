
-- =========================
-- Conversations
-- =========================
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, org_id)
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sender_user_id uuid,
  author_name text NOT NULL,
  author_role text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_participants_org ON public.conversation_participants(org_id);

-- =========================
-- Meeting requests
-- =========================
CREATE TABLE public.meeting_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  recipient_org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  requested_by uuid,
  proposed_for timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  agenda text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  response_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_requester ON public.meeting_requests(requester_org_id);
CREATE INDEX idx_meetings_recipient ON public.meeting_requests(recipient_org_id);

-- =========================
-- Grants
-- =========================
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.meeting_requests TO authenticated;
GRANT ALL ON public.meeting_requests TO service_role;

-- =========================
-- Helper: is the user a member of an org that participates in a conversation?
-- =========================
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user uuid, _conversation uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    JOIN public.org_members m ON m.org_id = cp.org_id
    WHERE cp.conversation_id = _conversation
      AND m.user_id = _user
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, anon;

-- =========================
-- RLS
-- =========================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations readable by participants"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), id));

CREATE POLICY "conversations insert by authenticated"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations update by participants"
  ON public.conversations FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(auth.uid(), id));

CREATE POLICY "participants readable by participants"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "participants insert by own org member"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    OR public.is_conversation_participant(auth.uid(), conversation_id)
  );

CREATE POLICY "participants update own org row"
  ON public.conversation_participants FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), org_id))
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "messages readable by participants"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

CREATE POLICY "messages insert by own org member"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND public.is_org_member(auth.uid(), sender_org_id)
    AND public.is_conversation_participant(auth.uid(), conversation_id)
  );

CREATE POLICY "meetings readable by both orgs"
  ON public.meeting_requests FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), requester_org_id)
    OR public.is_org_member(auth.uid(), recipient_org_id)
  );

CREATE POLICY "meetings insert by requester org member"
  ON public.meeting_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.is_org_member(auth.uid(), requester_org_id)
  );

CREATE POLICY "meetings update by both orgs"
  ON public.meeting_requests FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), requester_org_id)
    OR public.is_org_member(auth.uid(), recipient_org_id)
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), requester_org_id)
    OR public.is_org_member(auth.uid(), recipient_org_id)
  );

-- =========================
-- updated_at triggers
-- =========================
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER meeting_requests_set_updated_at
  BEFORE UPDATE ON public.meeting_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- Find or create the conversation between two orgs
-- =========================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_org_a uuid, _org_b uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF _org_a = _org_b THEN
    RAISE EXCEPTION 'same_org';
  END IF;
  IF NOT (public.is_org_member(v_user, _org_a) OR public.is_org_member(v_user, _org_b)) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  SELECT cp1.conversation_id INTO v_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp2.conversation_id = cp1.conversation_id
  WHERE cp1.org_id = _org_a AND cp2.org_id = _org_b
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.conversations (created_by) VALUES (v_user) RETURNING id INTO v_id;
  INSERT INTO public.conversation_participants (conversation_id, org_id)
    VALUES (v_id, _org_a), (v_id, _org_b);

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;

-- =========================
-- Realtime
-- =========================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
