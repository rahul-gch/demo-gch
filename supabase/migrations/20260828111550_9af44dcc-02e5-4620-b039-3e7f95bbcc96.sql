
CREATE TABLE public.showroom_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  materials TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showroom_products TO authenticated;
GRANT ALL ON public.showroom_products TO service_role;
ALTER TABLE public.showroom_products ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.orgs_are_connected(_org_a uuid, _org_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _org_a = _org_b
    OR EXISTS (
      SELECT 1
      FROM public.conversation_participants pa
      JOIN public.conversation_participants pb
        ON pa.conversation_id = pb.conversation_id
      WHERE pa.org_id = _org_a AND pb.org_id = _org_b
    )
    OR EXISTS (
      SELECT 1 FROM public.project_partners pp
      JOIN public.projects p ON p.id = pp.project_id
      WHERE (pp.org_id = _org_a AND p.owner_org_id = _org_b)
         OR (pp.org_id = _org_b AND p.owner_org_id = _org_a)
    )
    OR EXISTS (
      SELECT 1 FROM public.project_partners p1
      JOIN public.project_partners p2 ON p1.project_id = p2.project_id
      WHERE p1.org_id = _org_a AND p2.org_id = _org_b
    );
$$;

CREATE POLICY "Members manage own showroom products"
ON public.showroom_products FOR ALL TO authenticated
USING (public.is_org_member(auth.uid(), org_id))
WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Connected orgs can view active products"
ON public.showroom_products FOR SELECT TO authenticated
USING (
  is_active
  AND EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.user_id = auth.uid()
      AND public.orgs_are_connected(m.org_id, showroom_products.org_id)
  )
);

CREATE TABLE public.sample_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.showroom_products(id) ON DELETE SET NULL,
  seller_org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  buyer_org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  material TEXT,
  notes TEXT,
  shipping_address TEXT NOT NULL,
  needed_by DATE,
  status TEXT NOT NULL DEFAULT 'requested',
  conversation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sample_orders TO authenticated;
GRANT ALL ON public.sample_orders TO service_role;
ALTER TABLE public.sample_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer or seller members can view sample orders"
ON public.sample_orders FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), buyer_org_id) OR public.is_org_member(auth.uid(), seller_org_id));

CREATE POLICY "Buyer members can create sample orders"
ON public.sample_orders FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), buyer_org_id));

CREATE POLICY "Buyer or seller members can update sample orders"
ON public.sample_orders FOR UPDATE TO authenticated
USING (public.is_org_member(auth.uid(), buyer_org_id) OR public.is_org_member(auth.uid(), seller_org_id))
WITH CHECK (public.is_org_member(auth.uid(), buyer_org_id) OR public.is_org_member(auth.uid(), seller_org_id));

CREATE INDEX idx_showroom_products_org ON public.showroom_products(org_id);
CREATE INDEX idx_sample_orders_seller ON public.sample_orders(seller_org_id);
CREATE INDEX idx_sample_orders_buyer ON public.sample_orders(buyer_org_id);
