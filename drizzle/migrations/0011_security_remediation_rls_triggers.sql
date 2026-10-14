DROP POLICY IF EXISTS "participants insert by own org member" ON public.conversation_participants;
REVOKE INSERT ON public.conversation_participants FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.lock_participant_keys() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id OR NEW.org_id IS DISTINCT FROM OLD.org_id THEN
    RAISE EXCEPTION 'conversation_id and org_id cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_participant_keys ON public.conversation_participants;
CREATE TRIGGER trg_lock_participant_keys BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.lock_participant_keys();

DROP POLICY IF EXISTS "Members can send a request from their own org" ON public.org_connections;
CREATE POLICY "Members can send a request from their own org" ON public.org_connections
  FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND from_org_id <> to_org_id AND public.is_org_member(auth.uid(), from_org_id));

CREATE OR REPLACE FUNCTION public.lock_connection_keys() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.from_org_id IS DISTINCT FROM OLD.from_org_id OR NEW.to_org_id IS DISTINCT FROM OLD.to_org_id THEN
    RAISE EXCEPTION 'Connection organizations cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_connection_keys ON public.org_connections;
CREATE TRIGGER trg_lock_connection_keys BEFORE UPDATE ON public.org_connections
  FOR EACH ROW EXECUTE FUNCTION public.lock_connection_keys();

DROP POLICY IF EXISTS "partners update" ON public.project_partners;
CREATE OR REPLACE FUNCTION public.lock_partner_keys() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.org_id IS DISTINCT FROM OLD.org_id THEN
    RAISE EXCEPTION 'project_id and org_id cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_partner_keys ON public.project_partners;
CREATE TRIGGER trg_lock_partner_keys BEFORE UPDATE ON public.project_partners
  FOR EACH ROW EXECUTE FUNCTION public.lock_partner_keys();

DROP POLICY IF EXISTS "meetings update by both orgs" ON public.meeting_requests;
CREATE POLICY "meetings recipient answers" ON public.meeting_requests
  FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), recipient_org_id) OR public.is_platform_admin(auth.uid()))
  WITH CHECK ((public.is_org_member(auth.uid(), recipient_org_id) AND status IN ('confirmed','declined'))
              OR public.is_platform_admin(auth.uid()));
CREATE POLICY "meetings requester withdraws" ON public.meeting_requests
  FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), requester_org_id))
  WITH CHECK (public.is_org_member(auth.uid(), requester_org_id) AND status = 'cancelled');

CREATE OR REPLACE FUNCTION public.lock_meeting_keys() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.requester_org_id IS DISTINCT FROM OLD.requester_org_id
     OR NEW.recipient_org_id IS DISTINCT FROM OLD.recipient_org_id
     OR NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN
    RAISE EXCEPTION 'Meeting parties cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_meeting_keys ON public.meeting_requests;
CREATE TRIGGER trg_lock_meeting_keys BEFORE UPDATE ON public.meeting_requests
  FOR EACH ROW EXECUTE FUNCTION public.lock_meeting_keys();

CREATE OR REPLACE FUNCTION public.guard_org_platform_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_platform_admin(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_hidden := false;
    NEW.verification_status := NULL;
    NEW.on_time_rate := NULL;
  ELSE
    NEW.is_hidden := OLD.is_hidden;
    NEW.verification_status := OLD.verification_status;
    NEW.on_time_rate := OLD.on_time_rate;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_org_platform_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_org_platform_fields ON public.orgs;
CREATE TRIGGER trg_guard_org_platform_fields BEFORE INSERT OR UPDATE ON public.orgs
  FOR EACH ROW EXECUTE FUNCTION public.guard_org_platform_fields();

DROP POLICY IF EXISTS "activity insert" ON public.project_activity;
DROP POLICY IF EXISTS "activity insert by partners" ON public.project_activity;
CREATE POLICY "activity insert by owner or active partner" ON public.project_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.is_org_member(auth.uid(), p.owner_org_id))
    OR EXISTS (SELECT 1 FROM public.project_partners pp
               JOIN public.org_members m ON m.org_id = pp.org_id
               WHERE pp.project_id = project_activity.project_id AND m.user_id = auth.uid()
                 AND lower(pp.status) = 'active')
  );

DROP POLICY IF EXISTS "sample_orders_update" ON public.sample_orders;
DROP POLICY IF EXISTS "Buyer or seller members can update sample orders" ON public.sample_orders;
CREATE POLICY "Seller updates sample orders" ON public.sample_orders
  FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), seller_org_id))
  WITH CHECK (public.is_org_member(auth.uid(), seller_org_id)
              AND status IN ('requested','quoted','declined','shipped','delivered'));
CREATE POLICY "Buyer updates sample orders" ON public.sample_orders
  FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), buyer_org_id))
  WITH CHECK (public.is_org_member(auth.uid(), buyer_org_id)
              AND status IN ('confirmed','withdrawn'));

CREATE OR REPLACE FUNCTION public.lock_sample_order_keys() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.buyer_org_id IS DISTINCT FROM OLD.buyer_org_id
     OR NEW.seller_org_id IS DISTINCT FROM OLD.seller_org_id
     OR NEW.product_id IS DISTINCT FROM OLD.product_id THEN
    RAISE EXCEPTION 'Order parties and product cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_sample_order_keys ON public.sample_orders;
CREATE TRIGGER trg_lock_sample_order_keys BEFORE UPDATE ON public.sample_orders
  FOR EACH ROW EXECUTE FUNCTION public.lock_sample_order_keys();