ALTER TABLE public.sample_orders
  ADD COLUMN IF NOT EXISTS quoted_price numeric,
  ADD COLUMN IF NOT EXISTS quote_currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS shipping_cost numeric,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS quote_note text,
  ADD COLUMN IF NOT EXISTS tracking_ref text,
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

UPDATE public.sample_orders SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, updated_at) WHERE status = 'accepted';
UPDATE public.sample_orders SET status = 'delivered', delivered_at = COALESCE(delivered_at, updated_at) WHERE status = 'completed';
UPDATE public.sample_orders SET status = 'withdrawn' WHERE status = 'cancelled';

CREATE TABLE public.sample_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.sample_orders(id) ON DELETE CASCADE,
  actor_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  actor_user_id uuid,
  from_status text,
  to_status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sample_order_events_order ON public.sample_order_events(order_id, created_at);

GRANT SELECT, INSERT ON public.sample_order_events TO authenticated;
GRANT ALL ON public.sample_order_events TO service_role;

ALTER TABLE public.sample_order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order parties can view events" ON public.sample_order_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sample_orders o
    WHERE o.id = order_id
      AND (public.is_org_member(auth.uid(), o.buyer_org_id) OR public.is_org_member(auth.uid(), o.seller_org_id))
  ));

CREATE POLICY "Order parties can add events" ON public.sample_order_events
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sample_orders o
      WHERE o.id = order_id
        AND (public.is_org_member(auth.uid(), o.buyer_org_id) OR public.is_org_member(auth.uid(), o.seller_org_id))
    )
  );

-- Backfill an initial "requested" event for existing orders
INSERT INTO public.sample_order_events (order_id, actor_org_id, actor_user_id, from_status, to_status, created_at)
SELECT id, buyer_org_id, requested_by, NULL, 'requested', created_at FROM public.sample_orders;

-- Showroom image storage policies
DROP POLICY IF EXISTS "showroom_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "showroom_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "showroom_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "showroom_storage_delete" ON storage.objects;

CREATE POLICY "Signed-in users can view showroom images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'showroom');

CREATE POLICY "Org members can upload showroom images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'showroom'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.user_can_edit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can update showroom images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'showroom'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.user_can_edit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org members can delete showroom images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'showroom'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND public.user_can_edit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );