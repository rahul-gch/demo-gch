import type { Entity } from "./types";

// Profile sourced from the H&M Group Annual & Sustainability Report 2024
// (financial year 1 Dec 2023 – 30 Nov 2024). hmgroup.com
export const HM: Entity = {
  id: "gch-hm",
  gchNumber: "GCH-HM",
  name: "H&M Group",
  entityType: "Brand",
  rawEntityType: "Global Fashion & Design Group",
  organizationType: "Global Fashion & Design Group",
  actorType: "Tier 0",
  country: "Sweden",
  region: "Stockholm",
  city: "Stockholm",
  address: "Mäster Samuelsgatan 46A, 106 38 Stockholm",
  zipCode: "10638",
  latitude: 59.3326,
  longitude: 18.0649,
  description:
    "H&M Group is a family of brands (H&M, COS, Weekday, Monki, & Other Stories, ARKET, Singular Society, Sellpy and others) operating ~4,250 stores across 79 markets with ~140,000 colleagues. FY24 net sales SEK 234bn. 89% of materials used are recycled or sustainably sourced (target 100% by 2030).",
  comments:
    "Numbers sourced from the H&M Group Annual & Sustainability Report 2024, audited by Deloitte AB.",
  materials: [
    "Recycled polyester",
    "Organic / Better Cotton",
    "Recycled cotton",
    "Tencel / lyocell",
    "Recycled wool",
    "Recycled down (Re-Down)",
  ],
  capabilities: [
    "Fashion design",
    "Omni-channel retail",
    "Digital commerce",
    "Resale (Sellpy)",
    "Textile-to-textile recycling (Looper Textile Co.)",
  ],
  capacity: "~3 billion garments / year across portfolio brands",
  moq: "Brand — sets contracted MOQs with finished-goods suppliers",
  leadTimeDays: 90,
  certifications: [
    "Better Cotton",
    "GOTS",
    "GRS",
    "RCS",
    "OCS",
    "ZDHC",
    "bluesign",
    "Higg FEM / FSLM",
    "SBTi (1.5°C aligned)",
    "GRI / EU CSRD",
  ],
  certificationDetails: [
    {
      category: "Climate",
      name: "Science Based Targets initiative (1.5°C)",
      lastVerified: "2024-11-30",
      expiryDate: "2030-12-31",
      status: "Verified",
    },
    {
      category: "Chemicals",
      name: "ZDHC Roadmap to Zero",
      lastVerified: "2024-11-30",
      expiryDate: "2026-11-30",
      status: "Verified",
    },
    {
      category: "Materials",
      name: "Textile Exchange — GRS / RCS / OCS",
      lastVerified: "2024-11-30",
      expiryDate: "2026-11-30",
      status: "Verified",
    },
    {
      category: "Disclosure",
      name: "EU CSRD / ESRS 2024",
      lastVerified: "2025-03-31",
      expiryDate: "2026-03-31",
      status: "Verified",
    },
  ],
  governance:
    "Board-level sustainability oversight via the H&M Group Board. Audited by Deloitte AB. CSRD-aligned reporting from FY24.",
  traceabilityNotes:
    "Public supplier list maintained by H&M Group. Tier 1 & 2 mills disclosed. Active Better Cotton and Textile Exchange partner. Material substitution and circularity investments via H&M Group Ventures, Looper Textile Co. and Sellpy.",
  contacts: [
    { name: "H&M Group Investor Relations", email: "ir@hm.com", phone: "+46-8-796-55-00", role: "Investor Relations" },
    { name: "H&M Group Sustainability", email: "sustainability@hm.com", phone: "", role: "Sustainability Lead" },
  ],
  confidenceScore: 94,
  riskLevel: "Low",
  evidenceCount: 11,
  verifiedCertCount: 4,
  expiredCertCount: 0,
  missingDataCount: 0,
  profileCompleteness: 96,
  verificationStatus: "Verified",
  preferredCommunicationChannel: "Email",
  kpiReadiness: 92,
  traceabilityReadiness: 88,
  matchmakingReadiness: 86,
  missingFields: [],
  recommendedNextAction:
    "Use FY24 CSRD disclosures to seed peer-benchmark and matchmaking flows across H&M's tier 1 & 2 suppliers.",
};

export const HM_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  KPI001: { value: 56, display: "56% reduction", confidence: 92, source: "H&M Group A&S Report 2024 — Scope 1 & 2 vs 2019" },
  KPI002: { value: 23, display: "23% reduction", confidence: 86, source: "H&M Group A&S Report 2024 — Scope 3 vs 2019" },
  KPI003: { value: 33, display: "33%", confidence: 88, source: "H&M Group 2024 — Recycled material share" },
  KPI004: { value: 89, display: "89%", confidence: 94, source: "H&M Group 2024 — Recycled or sustainably sourced materials" },
  KPI005: { value: 100, display: "100%", confidence: 95, source: "H&M Group — Public Tier 1 supplier list" },
  KPI006: { value: 96, display: "96%", confidence: 90, source: "H&M Group — Public Tier 2 supplier list" },
  KPI010: { value: 100, display: "100%", confidence: 95, source: "H&M Group 2024 — Renewable electricity in own operations" },
  KPI012: { value: 95, display: "95%", confidence: 88, source: "H&M Group 2024 — ZDHC MRSL conformance" },
};
