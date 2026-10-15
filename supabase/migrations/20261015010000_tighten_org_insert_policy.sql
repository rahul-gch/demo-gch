-- Prevent arbitrary authenticated users from inserting organizations directly.
-- The application onboarding path uses the trusted server client and remains functional.
DROP POLICY IF EXISTS "orgs insert by authenticated" ON public.orgs;

CREATE POLICY "orgs insert by creator"
  ON public.orgs
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
