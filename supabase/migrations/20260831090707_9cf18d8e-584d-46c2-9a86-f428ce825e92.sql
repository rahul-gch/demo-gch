DROP POLICY IF EXISTS "Connected orgs can view active products" ON public.showroom_products;

CREATE POLICY "Signed-in users can view active products"
ON public.showroom_products
FOR SELECT
TO authenticated
USING (is_active);