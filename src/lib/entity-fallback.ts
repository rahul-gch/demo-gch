import type { Entity } from "@/seed/types";

export interface MinimalOrg {
  id: string;
  name: string;
  entityType?: string | null;
  organizationType?: string | null;
  country?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  verificationStatus?: string | null;
  routeId?: string | null;
  slug?: string | null;
}

/**
 * Builds a display-only Entity for organizations that are not (yet) part of the
 * in-memory registry — e.g. an organization created moments ago. Only the
 * fields used by conversation and meeting surfaces carry real values.
 */
export function fallbackEntity(org: MinimalOrg): Entity {
  return {
    id: org.routeId || org.slug || org.id,
    isSeeded: false,
    orgUuid: org.id,
    slug: org.slug ?? undefined,
    logoUrl: org.logoUrl ?? undefined,
    bannerUrls: [],
    gchNumber: "",
    name: org.name,
    entityType: (org.entityType || "Brand") as Entity["entityType"],
    rawEntityType: org.entityType || "",
    organizationType: org.organizationType || org.entityType || "Organization",
    actorType: "Tier 1",
    country: org.country || "",
    region: "",
    city: org.city || "",
    address: "",
    zipCode: "",
    latitude: 0,
    longitude: 0,
    description: "",
    comments: "",
    materials: [],
    capabilities: [],
    capacity: "",
    moq: "",
    leadTimeDays: 0,
    certifications: [],
    certificationDetails: [],
    governance: "",
    traceabilityNotes: "",
    contacts: [],
    confidenceScore: 0,
    riskLevel: "Medium",
    evidenceCount: 0,
    verifiedCertCount: 0,
    expiredCertCount: 0,
    missingDataCount: 0,
    profileCompleteness: 0,
    verificationStatus: (org.verificationStatus || "Incomplete") as Entity["verificationStatus"],
    preferredCommunicationChannel: "Platform Message",
    kpiReadiness: 0,
    traceabilityReadiness: 0,
    matchmakingReadiness: 0,
    missingFields: [],
    recommendedNextAction: "",
    productCategories: [],
    productTypes: [],
    specializations: [],
  };
}
