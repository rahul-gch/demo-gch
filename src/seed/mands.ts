import type { Entity } from "./types";

// Profile sourced from the Marks and Spencer Group plc ESG Report 2025
// (financial year 31 Mar 2024 – 29 Mar 2025). corporate.marksandspencer.com
export const MANDS: Entity = {
  id: "gch-mands",
  gchNumber: "GCH-MANDS",
  name: "Marks & Spencer Group plc",
  entityType: "Brand",
  rawEntityType: "Own-Brand Retailer (Fashion, Home, Food)",
  organizationType: "Own-Brand Retailer (Fashion, Home, Food)",
  actorType: "Tier 0",
  country: "United Kingdom",
  region: "London",
  city: "London",
  address: "Waterside House, 35 North Wharf Road, London W2 1NW",
  zipCode: "W2 1NW",
  latitude: 51.5197,
  longitude: -0.1761,
  description:
    "Marks & Spencer is a leading British own-brand retailer of Fashion, Home, Beauty and Food. ESG strategy 'Plan A' targets net zero by 2040. FY24/25 reports 33% Scope 1&2 reduction vs 2016/17, 91% recycled polyester and 100% more responsibly sourced cotton in Fashion, Home & Beauty.",
  comments: "Numbers sourced from M&S Group plc ESG Report 2025 and Basis of Reporting 2025.",
  materials: [
    "More responsibly sourced cotton (Better Cotton / organic / recycled)",
    "Verified recycled polyester",
    "Responsibly sourced wool",
    "FSC-certified viscose / man-made cellulosics",
    "RDS down & feathers",
    "RWS wool",
  ],
  capabilities: [
    "Fashion design & retail",
    "Food retail",
    "Home & Beauty retail",
    "Pre-loved takeback (Another Life with Oxfam)",
    "Plastic packaging reduction",
  ],
  capacity: "Own-brand range across Fashion, Home, Beauty and Food across ~1,000 stores",
  moq: "Brand — sets contracted MOQs with own-brand suppliers",
  leadTimeDays: 100,
  certifications: [
    "Better Cotton",
    "GRS / RCS",
    "RDS",
    "RWS",
    "FSC",
    "SBTi (Net Zero 2040)",
    "Business Benchmark on Farm Animal Welfare (Tier 1)",
    "Modern Slavery Statement",
  ],
  certificationDetails: [
    {
      category: "Climate",
      name: "SBTi Net Zero (2040)",
      lastVerified: "2025-03-29",
      expiryDate: "2040-12-31",
      status: "Verified",
    },
    {
      category: "Animal Welfare",
      name: "BBFAW — Tier 1 leadership",
      lastVerified: "2025-01-31",
      expiryDate: "2026-01-31",
      status: "Verified",
    },
    {
      category: "Materials",
      name: "Textile Exchange — RCS / GRS / RDS / RWS",
      lastVerified: "2025-03-29",
      expiryDate: "2027-03-29",
      status: "Verified",
    },
    {
      category: "Social",
      name: "Modern Slavery Statement 2025",
      lastVerified: "2025-06-01",
      expiryDate: "2026-06-01",
      status: "Verified",
    },
  ],
  governance:
    "ESG Committee chaired by Tamara Ingram. Reporting aligned with TCFD; independent limited assurance on key metrics.",
  traceabilityNotes:
    "Plan A programme covers Environment (route to net zero, sourcing with care, making with care, wasting as little as possible) and Social. Public Tier 1 supplier list; deepening Tier 2 visibility through Better Cotton and Textile Exchange.",
  contacts: [
    {
      name: "M&S Investor Relations",
      email: "investor.relations@marks-and-spencer.com",
      phone: "+44-20-7935-4422",
      role: "Investor Relations",
    },
    {
      name: "M&S Plan A / ESG Team",
      email: "plana@marks-and-spencer.com",
      phone: "",
      role: "Sustainability Lead",
    },
  ],
  confidenceScore: 92,
  riskLevel: "Low",
  evidenceCount: 9,
  verifiedCertCount: 4,
  expiredCertCount: 0,
  missingDataCount: 1,
  profileCompleteness: 95,
  verificationStatus: "Verified",
  preferredCommunicationChannel: "Email",
  kpiReadiness: 90,
  traceabilityReadiness: 84,
  matchmakingReadiness: 82,
  missingFields: ["Tier 3 raw-material map"],
  recommendedNextAction:
    "Extend tier 2 disclosure to tier 3 cotton & wool farms to lift traceability score.",
};

export const MANDS_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  KPI001: {
    value: 33,
    display: "33% reduction",
    confidence: 94,
    source: "M&S ESG Report 2025 — Scope 1 & 2 vs 2016/17",
  },
  KPI002: {
    value: 18,
    display: "18% reduction",
    confidence: 80,
    source: "M&S ESG Report 2025 — Scope 3 vs 2016/17",
  },
  KPI003: {
    value: 91,
    display: "91%",
    confidence: 94,
    source: "M&S 2025 — Verified recycled polyester in FHB",
  },
  KPI004: {
    value: 100,
    display: "100%",
    confidence: 95,
    source: "M&S 2025 — More responsibly sourced cotton in FHB",
  },
  KPI005: {
    value: 100,
    display: "100%",
    confidence: 92,
    source: "M&S 2025 — Public Tier 1 supplier disclosure",
  },
  KPI010: {
    value: 100,
    display: "100%",
    confidence: 93,
    source: "M&S 2025 — 100% renewable electricity in UK & ROI ops",
  },
  KPI013: {
    value: 148,
    display: "148m units removed",
    confidence: 90,
    source: "M&S 2025 — Plastic packaging pieces removed",
  },
};
