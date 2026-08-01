import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Entity } from "@/seed/types";

const ORG_COLUMNS = `
  id, legacy_id, gch_number, slug, name, type, entity_type, raw_entity_type, organization_type,
  tier, country, region, city, address, zip_code, latitude, longitude, description, comments,
  website, logo_url, banner_urls, materials, capabilities, certifications, product_categories,
  product_types, specializations, capacity, moq, lead_time_days, contacts, certification_details,
  governance, traceability_notes, confidence_score, risk_level, evidence_count, verified_cert_count,
  expired_cert_count, missing_data_count, profile_completeness, verification_status,
  preferred_channel, kpi_readiness, traceability_readiness, matchmaking_readiness, missing_fields,
  recommended_next_action, rating, on_time_rate, avg_delay_days, delivery_timeframe_days
`;

type OrgRow = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const numOr = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

export function rowToEntity(row: OrgRow): Entity {
  const tier = row.tier as number | null;
  return {
    id: str(row.legacy_id) || str(row.id),
    isSeeded: !!str(row.legacy_id),
    orgUuid: str(row.id),
    slug: str(row.slug),
    gchNumber: str(row.gch_number),
    name: str(row.name),
    website: str(row.website) || undefined,
    logoUrl: str(row.logo_url) || undefined,
    bannerUrls: list(row.banner_urls),
    entityType: (str(row.entity_type) || str(row.type) || "Brand") as Entity["entityType"],
    rawEntityType: str(row.raw_entity_type) || str(row.type),
    organizationType: str(row.organization_type) || str(row.type),
    actorType: (tier === null || tier === undefined ? "Tier 1" : `Tier ${tier}`) as Entity["actorType"],
    country: str(row.country),
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
    verificationStatus: (str(row.verification_status) || "Incomplete") as Entity["verificationStatus"],
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

export const listEntities = createServerFn({ method: "GET" }).handler(async (): Promise<Entity[]> => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error("[entities] missing supabase env", { hasUrl: !!url, hasKey: !!key });
    return [];
  }


  const supabase = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const all: Entity[] = [];
  const pageSize = 1000;
  for (let page = 0; page < 10; page++) {
    const { data, error } = await supabase
      .from("orgs")
      .select(ORG_COLUMNS)
      .order("name", { ascending: true })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as OrgRow[];
    all.push(...rows.map(rowToEntity));
    if (rows.length < pageSize) break;
  }
  return all;
});
