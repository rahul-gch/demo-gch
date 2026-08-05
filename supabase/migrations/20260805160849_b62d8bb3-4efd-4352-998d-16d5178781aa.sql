-- 1. USER CONSENTS -----------------------------------------------------------
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type text NOT NULL CHECK (policy_type IN ('terms','privacy','marketing')),
  policy_version text NOT NULL,
  accepted boolean NOT NULL DEFAULT true,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, policy_type, policy_version)
);

GRANT SELECT, INSERT, UPDATE ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own consents readable" ON public.user_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "own consents insertable" ON public.user_consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own consents updatable" ON public.user_consents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER user_consents_updated_at BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. DATA SUBJECT REQUESTS ----------------------------------------------------
CREATE TABLE public.data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('export','deletion')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  note text,
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.data_requests TO authenticated;
GRANT ALL ON public.data_requests TO service_role;

ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data requests readable" ON public.data_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "own data requests insertable" ON public.data_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "platform admins update data requests" ON public.data_requests
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER data_requests_updated_at BEFORE UPDATE ON public.data_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. SECURITY EVENT LOG -------------------------------------------------------
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX security_events_created_at_idx ON public.security_events (created_at DESC);
CREATE INDEX security_events_org_idx ON public.security_events (org_id, created_at DESC);

GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security events readable by admins" ON public.security_events
  FOR SELECT TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR (org_id IS NOT NULL AND public.user_can_manage(auth.uid(), org_id))
    OR user_id = auth.uid()
  );

CREATE POLICY "security events insertable by self" ON public.security_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. PUBLIC ORGANIZATION DIRECTORY VIEW ---------------------------------------
CREATE VIEW public.org_public_profiles
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  name,
  type,
  entity_type,
  country,
  region,
  city,
  website,
  description,
  logo_url,
  certifications,
  capabilities,
  materials,
  product_categories,
  product_types,
  specializations,
  verification_status,
  created_at
FROM public.orgs;

GRANT SELECT ON public.org_public_profiles TO authenticated;