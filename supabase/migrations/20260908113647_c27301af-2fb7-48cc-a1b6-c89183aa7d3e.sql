-- 1. Column-level restriction on public.orgs -----------------------------
REVOKE SELECT ON public.orgs FROM authenticated;
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
  delivery_timeframe_days, created_by, profile_score, onboarding_completed_at
) ON public.orgs TO authenticated;
GRANT ALL ON public.orgs TO service_role;

CREATE OR REPLACE FUNCTION public.org_private_details(_org uuid)
RETURNS TABLE (
  contacts jsonb,
  comments text,
  governance text,
  traceability_notes text,
  profile_answers jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.contacts, o.comments, o.governance, o.traceability_notes, o.profile_answers
  FROM public.orgs o
  WHERE o.id = _org
    AND (
      public.is_platform_admin(auth.uid())
      OR public.is_org_member(auth.uid(), o.id)
      OR EXISTS (
        SELECT 1 FROM public.org_members m
        WHERE m.user_id = auth.uid()
          AND public.orgs_are_connected(m.org_id, o.id)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.org_private_details(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_private_details(uuid) TO authenticated;

-- 2. Enforce project_documents.visibility ---------------------------------
DROP POLICY IF EXISTS "documents readable by members" ON public.project_documents;
CREATE POLICY "documents readable by members"
ON public.project_documents
FOR SELECT
TO authenticated
USING (
  public.is_platform_admin(auth.uid())
  OR (
    public.is_project_member(auth.uid(), project_id)
    AND (
      visibility <> 'Owner Only'
      OR uploaded_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_documents.project_id
          AND public.is_org_member(auth.uid(), p.owner_org_id)
      )
    )
  )
);

-- 3. Showroom storage images mirror the showroom connection rule ----------
DROP POLICY IF EXISTS "Signed-in users can view showroom images" ON storage.objects;
CREATE POLICY "Connected orgs can view showroom images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'showroom'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND public.orgs_are_connected(m.org_id, ((storage.foldername(name))[1])::uuid)
    )
  )
);