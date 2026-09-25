import { createServerFn } from "@tanstack/react-start";
import type { Entity } from "@/seed/types";

// Private columns (contacts, comments, governance, traceability_notes,
// profile_answers) are deliberately excluded: they are restricted at the
// database level to members, connected orgs and platform admins, and are read
// through the `org_private_details` lookup instead.
const BASE_COLUMNS = `
  id, legacy_id, gch_number, slug, name, type, entity_type, raw_entity_type, organization_type,
  tier, country, region, city, address, zip_code, latitude, longitude, description,
  website, logo_url, banner_urls, materials, capabilities, certifications, product_categories,
  product_types, specializations, capacity, moq, lead_time_days, certification_details,
  confidence_score, risk_level, evidence_count, verified_cert_count,
  expired_cert_count, missing_data_count, profile_completeness, verification_status,
  preferred_channel, kpi_readiness, traceability_readiness, matchmaking_readiness, missing_fields,
  recommended_next_action, rating, on_time_rate, avg_delay_days, delivery_timeframe_days,
  is_hidden
`;

type OrgRow = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const numOr = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

export function rowToEntity(row: OrgRow): Entity {
  const tier = row.tier as number | null;
  const profileAnswers = (row.profile_answers as Record<string, unknown> | undefined) ?? {};
  const operatingCountries =
    list(row.operating_countries).length > 0
      ? list(row.operating_countries)
      : list(profileAnswers.operating_countries);

  return {
    id: str(row.slug) || str(row.legacy_id) || str(row.id),
    isSeeded: !!str(row.legacy_id),
    orgUuid: str(row.id),
    isHidden: row.is_hidden === true,
    slug: str(row.slug),
    gchNumber: str(row.gch_number),
    name: str(row.name),
    website: str(row.website) || undefined,
    logoUrl: str(row.logo_url) || undefined,
    bannerUrls: list(row.banner_urls),
    entityType: (str(row.entity_type) || str(row.type) || "Brand") as Entity["entityType"],
    rawEntityType: str(row.raw_entity_type) || str(row.type),
    organizationType: str(row.organization_type) || str(row.type),
    actorType: (tier === null || tier === undefined
      ? "Tier 1"
      : `Tier ${tier}`) as Entity["actorType"],
    country: str(row.country),
    operatingCountries,
    region: str(row.region),
    city: str(row.city),
    address: str(row.address),
    zipCode: str(row.zip_code),
    latitude: numOr(row.latitude),
    longitude: numOr(row.longitude),
    description: str(row.description),
    comments: str(row.comments),
    materials: list(row.materials),
    capabilities: list(row.capabilities),
    capacity: str(row.capacity),
    moq: str(row.moq),
    leadTimeDays: numOr(row.lead_time_days),
    certifications: list(row.certifications),
    certificationDetails: (Array.isArray(row.certification_details)
      ? row.certification_details
      : []) as Entity["certificationDetails"],
    governance: str(row.governance),
    traceabilityNotes: str(row.traceability_notes),
    contacts: (Array.isArray(row.contacts) ? row.contacts : []) as Entity["contacts"],
    confidenceScore: numOr(row.confidence_score, 50),
    riskLevel: (str(row.risk_level) || "Medium") as Entity["riskLevel"],
    evidenceCount: numOr(row.evidence_count),
    verifiedCertCount: numOr(row.verified_cert_count),
    expiredCertCount: numOr(row.expired_cert_count),
    missingDataCount: numOr(row.missing_data_count),
    profileCompleteness: numOr(row.profile_completeness),
    verificationStatus: (str(row.verification_status) ||
      "Incomplete") as Entity["verificationStatus"],
    preferredCommunicationChannel: (str(row.preferred_channel) ||
      "Email") as Entity["preferredCommunicationChannel"],
    kpiReadiness: numOr(row.kpi_readiness),
    traceabilityReadiness: numOr(row.traceability_readiness),
    matchmakingReadiness: numOr(row.matchmaking_readiness),
    missingFields: list(row.missing_fields),
    recommendedNextAction: str(row.recommended_next_action),
    rating: (row.rating as number | null) ?? undefined,
    productCategories: list(row.product_categories),
    productTypes: list(row.product_types),
    specializations: list(row.specializations),
    onTimeRate: (row.on_time_rate as number | null) ?? undefined,
    avgDelayDays: (row.avg_delay_days as number | null) ?? undefined,
    deliveryTimeframeDays: (row.delivery_timeframe_days as number | null) ?? undefined,
  };
}

/**
 * Returns every organization on the platform, hydrated into Entity objects.
 *
 * Runs as the signed-in user (not the publishable/anon key) so the directory is
 * only available to authenticated members — the orgs SELECT policy is scoped to
 * the authenticated role and the `contacts` field must never be exposed to anon.
 */
export const listEntities = createServerFn({ method: "GET" }).handler(
  async (): Promise<Entity[]> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const authHeader = getRequest()?.headers?.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    // Signed-out / SSR requests (auth page, public routes) get an empty registry
    // instead of a thrown 401 that would blank the app.
    if (!token) return [];

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      },
    );

    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims?.sub) return [];

    const all: Entity[] = [];
    const pageSize = 1000;
    let queryCols = `${BASE_COLUMNS}, operating_countries`;

    for (let page = 0; page < 10; page++) {
      let res = await supabase
        .from("orgs")
        .select(queryCols)
        .order("name", { ascending: true })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (res.error && res.error.message.includes("operating_countries")) {
        queryCols = BASE_COLUMNS;
        res = await supabase
          .from("orgs")
          .select(queryCols)
          .order("name", { ascending: true })
          .range(page * pageSize, page * pageSize + pageSize - 1);
      }

      if (res.error) throw new Error(res.error.message);
      const rows = (res.data ?? []) as unknown as OrgRow[];
      all.push(...rows.map(rowToEntity));
      if (rows.length < pageSize) break;
    }
    return all;
  },
);
