import type { Entity } from "./types";

// Profile derived from FY24 NIKE, Inc. Sustainability Data report
// (about.nike.com/en/mission). Numbers cited verbatim where possible.
export const NIKE: Entity = {
  id: "gch-nike",
  gchNumber: "GCH-NIKE",
  name: "NIKE, Inc.",
  entityType: "Brand",
  rawEntityType: "Global Footwear & Apparel Brand",
  organizationType: "Global Footwear & Apparel Brand",
  actorType: "Tier 0",
  country: "United States",
  region: "Oregon",
  city: "Beaverton",
  address: "One Bowerman Drive, Beaverton, OR 97005",
  zipCode: "97005",
  latitude: 45.5106,
  longitude: -122.7795,
  description:
    "NIKE, Inc. designs, develops and markets footwear, apparel, equipment and accessories worldwide across the Nike, Jordan and Converse brands. FY24 Sustainability Data reports 69% absolute Scope 1 & 2 reduction and 36% absolute Scope 3 (manufacturing + transportation) reduction vs FY20.",
  comments:
    "Profile sourced from the FY24 NIKE, Inc. Sustainability Data report (fiscal year June 2023 – May 2024).",
  materials: [
    "Recycled polyester",
    "Organic / BCI cotton",
    "LWG-certified leather",
    "Recycled rubber",
    "Recycled nylon",
  ],
  capabilities: [
    "Footwear design & manufacturing",
    "Performance apparel",
    "Sports equipment",
    "Direct-to-consumer retail",
    "Global logistics",
  ],
  capacity: "1B+ units / year across footwear, apparel and equipment",
  moq: "Brand — sets contracted MOQs with finished-goods suppliers",
  leadTimeDays: 120,
  certifications: [
    "bluesign",
    "Leather Working Group",
    "Higg FEM",
    "ZDHC",
    "Sustainable Apparel Coalition",
    "SBTi (1.5°C aligned)",
    "GRI Standards",
    "SASB",
  ],
  certificationDetails: [
    {
      category: "Chemicals",
      name: "ZDHC Roadmap to Zero",
      lastVerified: "2024-05-31",
      expiryDate: "2026-05-31",
      status: "Verified",
    },
    {
      category: "Materials — Leather",
      name: "Leather Working Group (LWG) Audited",
      lastVerified: "2024-04-15",
      expiryDate: "2026-04-15",
      status: "Verified",
    },
    {
      category: "Materials — Textiles",
      name: "bluesign system partner",
      lastVerified: "2024-03-01",
      expiryDate: "2026-03-01",
      status: "Verified",
    },
    {
      category: "Social",
      name: "Sustainable Apparel Coalition / Higg FSLM",
      lastVerified: "2024-05-31",
      expiryDate: "2026-05-31",
      status: "Verified",
    },
    {
      category: "Climate",
      name: "Science Based Targets initiative (1.5°C)",
      lastVerified: "2023-09-01",
      expiryDate: "2030-12-31",
      status: "Verified",
    },
  ],
  governance:
    "Sustainability oversight by the Corporate Responsibility, Sustainability & Governance Committee of the NIKE Board. External assurance obtained on energy, Scope 1 & 2 GHG, a subset of Scope 3 GHG and cumulative water restoration funding.",
  traceabilityNotes:
    "Suppliers mapped across finished-goods, materials, licensees and packaging. Code of Conduct + Code Leadership Standards enforced via Sustainable Manufacturing & Sourcing Index (SMSI). FY24 disclosures aligned with GRI, SASB and UNGC.",
  contacts: [
    {
      name: "NIKE Investor Relations",
      email: "investorrelations@nike.com",
      phone: "+1-503-671-6453",
      role: "Investor Relations",
    },
    {
      name: "NIKE Purpose / Sustainability",
      email: "purpose@nike.com",
      phone: "",
      role: "Sustainability Lead",
    },
    {
      name: "NIKE Supplier Engagement",
      email: "supplierengagement@nike.com",
      phone: "",
      role: "Responsible Supply Chain",
    },
  ],
  confidenceScore: 96,
  riskLevel: "Low",
  evidenceCount: 12,
  verifiedCertCount: 5,
  expiredCertCount: 0,
  missingDataCount: 0,
  profileCompleteness: 98,
  verificationStatus: "Verified",
  preferredCommunicationChannel: "Email",
  kpiReadiness: 96,
  traceabilityReadiness: 90,
  matchmakingReadiness: 88,
  missingFields: [],
  recommendedNextAction:
    "Use FY24 disclosures to seed peer-benchmark and matchmaking flows for Tier-1 and Tier-2 suppliers.",
};

// Hard-coded KPI overrides for Nike, sourced from the FY24 report.
// Values are normalized to the GCH KPI library (0-100 % or % reduction).
export const NIKE_KPI_OVERRIDES: Record<
  string,
  { value: number; display: string; confidence: number; source: string }
> = {
  KPI001: {
    value: 69,
    display: "69% reduction",
    confidence: 95,
    source: "FY24 NIKE Sustainability Data — Scope 1 & 2 vs FY20",
  },
  KPI002: {
    value: 36,
    display: "36% reduction",
    confidence: 92,
    source: "FY24 NIKE Sustainability Data — Scope 3 (mfg + transport) vs FY20",
  },
  KPI003: {
    value: 96,
    display: "96%",
    confidence: 90,
    source: "FY24 NIKE — Recycled polyester share where technically possible",
  },
  KPI004: {
    value: 92,
    display: "92%",
    confidence: 88,
    source: "FY24 NIKE — Preferred / certified material share",
  },
  KPI010: {
    value: 100,
    display: "100%",
    confidence: 96,
    source: "FY24 NIKE — Renewable electricity in owned/operated facilities",
  },
  KPI011: {
    value: 40,
    display: "40% reduction",
    confidence: 90,
    source: "FY24 NIKE — Freshwater consumption, material manufacturing suppliers",
  },
  KPI013: {
    value: 100,
    display: "100%",
    confidence: 95,
    source: "FY24 NIKE — Waste diverted from landfill, strategic finished-goods suppliers",
  },
};
