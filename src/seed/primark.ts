import type { Entity } from "./types";

// Profile sourced from Primark Sustainability and Ethics Progress Report 2023/24
// primark.com/en-ie/our-ethics-environment
export const PRIMARK: Entity = {
  id: "gch-primark",
  gchNumber: "GCH-PRIMARK",
  name: "Primark",
  entityType: "Brand",
  rawEntityType: "High-Street Fashion Retailer",
  organizationType: "High-Street Fashion Retailer (ABF)",
  actorType: "Tier 0",
  country: "Ireland",
  region: "Dublin",
  city: "Dublin",
  address: "Arthur Ryan House, 22-24 Parnell Street, Dublin 1, D01 T6V8",
  zipCode: "D01 T6V8",
  latitude: 53.3526,
  longitude: -6.2628,
  description:
    "Primark is a high-street fashion retailer operating in 17 markets with 80,000+ colleagues. Primark Cares strategy targets all clothes made from recycled or more sustainably sourced materials and halved carbon footprint by 2030.",
  comments:
    "Numbers sourced from Primark Sustainability and Ethics Progress Report 2023/24 (EY limited assurance).",
  materials: [
    "Better Cotton",
    "Organic cotton",
    "Recycled cotton (Recover™ partnership)",
    "Recycled polyester",
    "Responsibly sourced viscose (Canopy)",
    "Recycled hangers / packaging",
  ],
  capabilities: [
    "High-street fashion retail",
    "In-store repair workshops (Love it for Longer)",
    "Textile takeback",
    "Durability framework (with WRAP)",
  ],
  capacity: "~1bn garments / year across 17 markets",
  moq: "Brand — sets contracted MOQs with finished-goods suppliers",
  leadTimeDays: 110,
  certifications: [
    "Better Cotton",
    "Textile Exchange",
    "ZDHC Roadmap to Zero",
    "WRAP / Textiles 2030",
    "Ellen MacArthur Foundation (Fashion Advisory Board)",
    "Ethical Trading Initiative",
    "Modern Slavery Statement",
  ],
  certificationDetails: [
    {
      category: "Chemicals",
      name: "ZDHC Roadmap to Zero",
      lastVerified: "2024-08-31",
      expiryDate: "2026-08-31",
      status: "Verified",
    },
    {
      category: "Materials",
      name: "Better Cotton member",
      lastVerified: "2024-08-31",
      expiryDate: "2026-08-31",
      status: "Verified",
    },
    {
      category: "Circularity",
      name: "WRAP — Textiles 2030 Advisory Group",
      lastVerified: "2024-10-24",
      expiryDate: "2030-12-31",
      status: "Verified",
    },
    {
      category: "Social",
      name: "Ethical Trading Initiative + Modern Slavery Statement 2024",
      lastVerified: "2024-12-31",
      expiryDate: "2025-12-31",
      status: "Verified",
    },
    {
      category: "Assurance",
      name: "EY limited assurance on selected KPIs",
      lastVerified: "2024-12-31",
      expiryDate: "2025-12-31",
      status: "Verified",
    },
  ],
  governance:
    "Primark Cares strategy led by Lynne Walker, Primark Cares Director. Sustainability KPIs cascaded to all Directors in 2023/24.",
  traceabilityNotes:
    "Public Global Sourcing Map (Tier 1 factories). Partnerships with Recover™ for recycled cotton, Canopy for MMCFs, WRAP for circularity and Textile Exchange for material standards.",
  contacts: [
    {
      name: "Primark Press / Investor Office (ABF)",
      email: "investor.relations@abfoods.com",
      phone: "+44-20-7399-6500",
      role: "Investor Relations (parent: ABF)",
    },
    {
      name: "Primark Cares Team",
      email: "sustainability@primark.com",
      phone: "",
      role: "Sustainability Lead",
    },
  ],
  confidenceScore: 90,
  riskLevel: "Low",
  evidenceCount: 8,
  verifiedCertCount: 5,
  expiredCertCount: 0,
  missingDataCount: 1,
  profileCompleteness: 93,
  verificationStatus: "Verified",
  preferredCommunicationChannel: "Email",
  kpiReadiness: 88,
  traceabilityReadiness: 82,
  matchmakingReadiness: 80,
  missingFields: ["Tier 2 mill-level disclosure"],
  recommendedNextAction:
    "Extend the public Global Sourcing Map to tier 2 mills, laundries and dye houses to lift traceability completeness.",
};

export const PRIMARK_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  KPI001: {
    value: 49,
    display: "49% reduction",
    confidence: 88,
    source: "Primark Progress Report 2023/24 — Scope 1 & 2 vs 2018/19",
  },
  KPI002: {
    value: 12,
    display: "12% reduction",
    confidence: 78,
    source: "Primark Progress Report 2023/24 — Scope 3 vs 2018/19",
  },
  KPI003: {
    value: 28,
    display: "28%",
    confidence: 82,
    source: "Primark 2023/24 — Recycled material share in clothes",
  },
  KPI004: {
    value: 70,
    display: "70%",
    confidence: 86,
    source: "Primark 2023/24 — Recycled or more sustainably sourced fibres",
  },
  KPI005: {
    value: 100,
    display: "100%",
    confidence: 92,
    source: "Primark Global Sourcing Map — Tier 1 factories",
  },
  KPI008: {
    value: 84,
    display: "84/100",
    confidence: 80,
    source: "Primark 2023/24 — Average ethical audit score",
  },
  KPI010: {
    value: 56,
    display: "56%",
    confidence: 78,
    source: "Primark 2023/24 — Renewable electricity in operations",
  },
};
