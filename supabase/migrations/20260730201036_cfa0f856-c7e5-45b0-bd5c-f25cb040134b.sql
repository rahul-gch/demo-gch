ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS legacy_id text,
  ADD COLUMN IF NOT EXISTS gch_number text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS raw_entity_type text,
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS comments text,
  ADD COLUMN IF NOT EXISTS governance text,
  ADD COLUMN IF NOT EXISTS traceability_notes text,
  ADD COLUMN IF NOT EXISTS contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certification_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS banner_urls text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS confidence_score integer,
  ADD COLUMN IF NOT EXISTS risk_level text,
  ADD COLUMN IF NOT EXISTS evidence_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_cert_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expired_cert_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missing_data_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_completeness integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS preferred_channel text,
  ADD COLUMN IF NOT EXISTS kpi_readiness integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS traceability_readiness integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matchmaking_readiness integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS missing_fields text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS recommended_next_action text,
  ADD COLUMN IF NOT EXISTS avg_delay_days integer,
  ADD COLUMN IF NOT EXISTS delivery_timeframe_days integer;

CREATE UNIQUE INDEX IF NOT EXISTS orgs_legacy_id_key ON public.orgs (legacy_id) WHERE legacy_id IS NOT NULL;

GRANT SELECT ON public.orgs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orgs TO authenticated;
GRANT ALL ON public.orgs TO service_role;