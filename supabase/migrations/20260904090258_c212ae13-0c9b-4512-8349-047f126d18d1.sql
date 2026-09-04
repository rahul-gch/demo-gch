DROP POLICY IF EXISTS "Signed-in users can view active products" ON public.showroom_products;

CREATE POLICY "Connected orgs can view active products"
ON public.showroom_products
FOR SELECT
TO authenticated
USING (
  is_active
  AND (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND public.orgs_are_connected(m.org_id, showroom_products.org_id)
    )
  )
);