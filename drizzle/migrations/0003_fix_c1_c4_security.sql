-- ====================================================================
-- Migration: 20261002000000_fix_c1_c4_security.sql
-- Security Fixes:
--   C1: Restore column-level restriction on public.orgs (GDPR contact leak)
--   C4: Restrict org_connections UPDATE policy to recipient org
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- C1: Restore column-level protection on public.orgs
-- --------------------------------------------------------------------
-- Revoke broad table-wide SELECT on public.orgs granted in migration 20260908224016
REVOKE SELECT ON public.orgs FROM authenticated;

-- Re-grant SELECT on non-sensitive columns only
-- Note: operating_countries added on 2026-09-08 is included to prevent UI regressions
GRANT SELECT (
  id, slug, name, type, country, region, size, tier, description, website,
  certifications, created_at, updated_at, logo_url, moq, lead_time_days, capacity,
  on_time_rate, materials, capabilities, product_categories, product_types, rating,
  specializations, legacy_id, gch_number, entity_type, raw_entity_type,
  organization_type, city, address, zip_code, latitude, longitude,
  certification_details, banner_urls, confidence_score, risk_level, evidence_count,
  verified_cert_count, expired_cert_count, missing_data_count, profile_completeness,
  verification_status, preferred_channel, kpi_readiness, traceability_readiness,
  matchmaking_readiness, missing_fields, recommended_next_action, avg_delay_days,
  delivery_timeframe_days, created_by, profile_score, onboarding_completed_at,
  operating_countries
) ON public.orgs TO authenticated;

-- Sensitive fields (contacts, comments, governance, traceability_notes, profile_answers)
-- remain accessible ONLY via public.org_private_details(_org uuid) RPC.


-- --------------------------------------------------------------------
-- C4: Only the recipient org (or platform admin) can accept/update a connection
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Members of either org can update the connection" ON public.org_connections;
DROP POLICY IF EXISTS "Recipient org decides on the connection" ON public.org_connections;

CREATE POLICY "Recipient org decides on the connection"
  ON public.org_connections FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), to_org_id)
    OR public.is_platform_admin(auth.uid())
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), to_org_id)
    OR public.is_platform_admin(auth.uid())
  );

COMMIT;