
-- Meeting requests: lifecycle + actor guard
CREATE OR REPLACE FUNCTION public.guard_meeting_request_lifecycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); is_admin boolean;
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF; -- trusted server/system path
  is_admin := public.is_platform_admin(uid);
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN RAISE EXCEPTION 'New meeting requests must be pending'; END IF;
    IF NEW.requested_by IS DISTINCT FROM uid THEN RAISE EXCEPTION 'Requester must be the signed-in user'; END IF;
    IF NOT public.is_org_member(uid, NEW.requester_org_id) THEN RAISE EXCEPTION 'Not a member of the requesting organization'; END IF;
    NEW.response_note := NULL;
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status <> 'pending' THEN RAISE EXCEPTION 'This meeting request has already been answered'; END IF;
    IF NEW.status IN ('confirmed','declined') THEN
      IF NOT (is_admin OR public.is_org_member(uid, OLD.recipient_org_id)) THEN RAISE EXCEPTION 'Only the invited organization can answer'; END IF;
    ELSIF NEW.status = 'cancelled' THEN
      IF NOT (is_admin OR public.is_org_member(uid, OLD.requester_org_id)) THEN RAISE EXCEPTION 'Only the requesting organization can withdraw'; END IF;
    ELSE
      RAISE EXCEPTION 'Invalid meeting status %', NEW.status;
    END IF;
  END IF;
  -- Content fields only editable by requester while pending; note only by recipient
  IF (NEW.agenda, NEW.proposed_for, NEW.duration_min) IS DISTINCT FROM (OLD.agenda, OLD.proposed_for, OLD.duration_min) THEN
    IF NOT (is_admin OR (OLD.status = 'pending' AND public.is_org_member(uid, OLD.requester_org_id))) THEN
      RAISE EXCEPTION 'Meeting details can only be changed by the requester while pending';
    END IF;
  END IF;
  IF NEW.response_note IS DISTINCT FROM OLD.response_note
     AND NOT (is_admin OR public.is_org_member(uid, OLD.recipient_org_id)) THEN
    RAISE EXCEPTION 'Only the invited organization can add a response note';
  END IF;
  NEW.requested_by := OLD.requested_by;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_meeting_request_lifecycle ON public.meeting_requests;
CREATE TRIGGER trg_guard_meeting_request_lifecycle BEFORE INSERT OR UPDATE ON public.meeting_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_meeting_request_lifecycle();

-- Sample orders: transition + field ownership guard
CREATE OR REPLACE FUNCTION public.guard_sample_order_lifecycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); is_admin boolean; is_seller boolean; is_buyer boolean; ok boolean := false;
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF;
  is_admin := public.is_platform_admin(uid);
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'requested' THEN RAISE EXCEPTION 'New sample orders must start as requested'; END IF;
    IF NOT (is_admin OR public.is_org_member(uid, NEW.buyer_org_id)) THEN RAISE EXCEPTION 'Not a member of the buying organization'; END IF;
    IF NEW.product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.showroom_products p WHERE p.id = NEW.product_id AND p.org_id = NEW.seller_org_id) THEN
      RAISE EXCEPTION 'Product does not belong to the seller';
    END IF;
    NEW.requested_by := uid;
    NEW.quoted_price := NULL; NEW.shipping_cost := NULL; NEW.lead_time_days := NULL; NEW.quote_note := NULL;
    NEW.tracking_ref := NULL; NEW.quoted_at := NULL; NEW.confirmed_at := NULL; NEW.shipped_at := NULL; NEW.delivered_at := NULL;
    RETURN NEW;
  END IF;
  IF is_admin THEN RETURN NEW; END IF;
  is_seller := public.is_org_member(uid, OLD.seller_org_id);
  is_buyer := public.is_org_member(uid, OLD.buyer_org_id);
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    ok := (is_seller AND (
            (OLD.status='requested' AND NEW.status='quoted') OR
            (OLD.status='quoted' AND NEW.status='requested') OR
            (OLD.status IN ('requested','quoted','confirmed') AND NEW.status='declined') OR
            (OLD.status='confirmed' AND NEW.status='shipped') OR
            (OLD.status='shipped' AND NEW.status='delivered')))
       OR (is_buyer AND (
            (OLD.status='quoted' AND NEW.status='confirmed') OR
            (OLD.status IN ('requested','quoted') AND NEW.status='withdrawn')));
    IF NOT ok THEN RAISE EXCEPTION 'Sample order cannot move from % to %', OLD.status, NEW.status; END IF;
  END IF;
  -- seller-owned fields
  IF (NEW.quoted_price, NEW.quote_currency, NEW.shipping_cost, NEW.lead_time_days, NEW.quote_note, NEW.tracking_ref)
     IS DISTINCT FROM (OLD.quoted_price, OLD.quote_currency, OLD.shipping_cost, OLD.lead_time_days, OLD.quote_note, OLD.tracking_ref)
     AND NOT is_seller THEN RAISE EXCEPTION 'Only the seller can edit quote and shipping details'; END IF;
  -- buyer-owned fields, only before confirmation
  IF (NEW.quantity, NEW.material, NEW.notes, NEW.shipping_address, NEW.needed_by)
     IS DISTINCT FROM (OLD.quantity, OLD.material, OLD.notes, OLD.shipping_address, OLD.needed_by)
     AND NOT (is_buyer AND OLD.status IN ('requested','quoted')) THEN
    RAISE EXCEPTION 'Order details can only be changed by the buyer before confirmation';
  END IF;
  NEW.requested_by := OLD.requested_by;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_sample_order_lifecycle ON public.sample_orders;
CREATE TRIGGER trg_guard_sample_order_lifecycle BEFORE INSERT OR UPDATE ON public.sample_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_sample_order_lifecycle();

-- Project activity: no actor spoofing
CREATE OR REPLACE FUNCTION public.guard_project_activity_actor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF;
  NEW.actor_user_id := uid;
  IF NEW.type = 'system' AND NOT public.is_platform_admin(uid) THEN RAISE EXCEPTION 'System events cannot be created by users'; END IF;
  IF NEW.actor_org_id IS NOT NULL AND NOT public.is_platform_admin(uid) AND NOT public.is_org_member(uid, NEW.actor_org_id) THEN
    RAISE EXCEPTION 'Actor organization must be your own';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_project_activity_actor ON public.project_activity;
CREATE TRIGGER trg_guard_project_activity_actor BEFORE INSERT ON public.project_activity
FOR EACH ROW EXECUTE FUNCTION public.guard_project_activity_actor();

REVOKE EXECUTE ON FUNCTION public.guard_meeting_request_lifecycle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_sample_order_lifecycle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_project_activity_actor() FROM PUBLIC, anon, authenticated;
