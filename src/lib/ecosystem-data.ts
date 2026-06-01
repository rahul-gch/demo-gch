// Real-world apparel ecosystem reference data (public record).
// Mirrors the seed orgs in the Supabase `orgs` table — slugs match DB.
// User-specific data (members, documents, custom edges) lives in the DB.
export type OrgType = "brand" | "supplier" | "verifier" | "regulator";
export type SizeBand = "S" | "M" | "L";
export type Region = "EU" | "Americas" | "APAC" | "MEA";

export type EcosystemOrg = {
  id: string;
  name: string;
  type: OrgType;
  tier: 1 | 2 | 3;
  country: string;
  region: Region;
  size: SizeBand;
  certifications: string[];
  confidence: number; // 0..1 — heuristic from public certification count, updated as docs are uploaded
  risk: number;       // 0..1 — inverse of confidence baseline
  users: number;
  status: "Verified" | "Pending" | "Flagged";
  lastActive: string;
  x: number; // 0..100 layout coords for graph
  y: number;
};

export type EcosystemEdge = {
  from: string;
  to: string;
  kind: "supply" | "verification" | "partnership";
  strength: number;
  evidenceCount: number;
};

export const ORGS: EcosystemOrg[] = [
  // Brands
  { id: "patagonia",        name: "Patagonia",              type: "brand",   tier: 1, country: "USA",         region: "Americas", size: "L", certifications: ["Fair Trade","bluesign","GOTS","RCS"], confidence: 0.92, risk: 0.10, users: 0, status: "Verified", lastActive: "—", x: 22, y: 38 },
  { id: "eileen-fisher",    name: "Eileen Fisher",          type: "brand",   tier: 1, country: "USA",         region: "Americas", size: "L", certifications: ["GOTS","RWS","Bluesign"],              confidence: 0.86, risk: 0.16, users: 0, status: "Verified", lastActive: "—", x: 12, y: 58 },
  { id: "stella-mccartney", name: "Stella McCartney",       type: "brand",   tier: 1, country: "UK",          region: "EU",       size: "L", certifications: ["GOTS","GRS","LWG"],                   confidence: 0.84, risk: 0.18, users: 0, status: "Verified", lastActive: "—", x: 70, y: 26 },
  { id: "veja",             name: "Veja",                   type: "brand",   tier: 1, country: "France",      region: "EU",       size: "M", certifications: ["Fair Trade","Organic"],               confidence: 0.78, risk: 0.22, users: 0, status: "Verified", lastActive: "—", x: 60, y: 14 },
  { id: "nudie-jeans",      name: "Nudie Jeans",            type: "brand",   tier: 1, country: "Sweden",      region: "EU",       size: "M", certifications: ["GOTS","Fair Wear"],                   confidence: 0.80, risk: 0.20, users: 0, status: "Verified", lastActive: "—", x: 78, y: 50 },
  // Suppliers
  { id: "arvind",           name: "Arvind Limited",         type: "supplier",tier: 2, country: "India",       region: "APAC",     size: "L", certifications: ["GOTS","BCI","Bluesign","LEED"],       confidence: 0.82, risk: 0.20, users: 0, status: "Verified", lastActive: "—", x: 50, y: 78 },
  { id: "welspun",          name: "Welspun India",          type: "supplier",tier: 2, country: "India",       region: "APAC",     size: "L", certifications: ["GOTS","OEKO-TEX","GRS","BCI"],       confidence: 0.83, risk: 0.19, users: 0, status: "Verified", lastActive: "—", x: 38, y: 88 },
  { id: "esquel",           name: "Esquel Group",           type: "supplier",tier: 2, country: "Hong Kong",   region: "APAC",     size: "L", certifications: ["BCI","GOTS","Higg FEM"],             confidence: 0.79, risk: 0.22, users: 0, status: "Verified", lastActive: "—", x: 90, y: 70 },
  { id: "texhong",          name: "Texhong Textile",        type: "supplier",tier: 3, country: "China",       region: "APAC",     size: "L", certifications: ["OEKO-TEX","BCI"],                    confidence: 0.62, risk: 0.36, users: 0, status: "Pending",  lastActive: "—", x: 85, y: 86 },
  { id: "calik-denim",      name: "Calik Denim",            type: "supplier",tier: 2, country: "Turkey",      region: "EU",       size: "L", certifications: ["GRS","OEKO-TEX","Bluesign"],         confidence: 0.78, risk: 0.22, users: 0, status: "Verified", lastActive: "—", x: 64, y: 64 },
  { id: "continental",      name: "Continental Clothing",   type: "supplier",tier: 2, country: "Germany",     region: "EU",       size: "M", certifications: ["GOTS","Fair Wear","PETA"],           confidence: 0.81, risk: 0.18, users: 0, status: "Verified", lastActive: "—", x: 52, y: 48 },
  // Verifiers
  { id: "control-union",    name: "Control Union",          type: "verifier",tier: 2, country: "Netherlands", region: "EU",       size: "L", certifications: ["ISO 17065","ISO 17021"],             confidence: 0.93, risk: 0.06, users: 0, status: "Verified", lastActive: "—", x: 44, y: 32 },
  { id: "sgs",              name: "SGS",                    type: "verifier",tier: 2, country: "Switzerland", region: "EU",       size: "L", certifications: ["ISO 17021","SMETA","ISO 17065"],     confidence: 0.94, risk: 0.05, users: 0, status: "Verified", lastActive: "—", x: 56, y: 26 },
  { id: "bureau-veritas",   name: "Bureau Veritas",         type: "verifier",tier: 2, country: "France",      region: "EU",       size: "L", certifications: ["ISO 17021","SMETA","ISO 17065"],     confidence: 0.93, risk: 0.06, users: 0, status: "Verified", lastActive: "—", x: 36, y: 22 },
  { id: "intertek",         name: "Intertek",               type: "verifier",tier: 2, country: "UK",          region: "EU",       size: "L", certifications: ["ISO 17021","SMETA","OEKO-TEX"],      confidence: 0.92, risk: 0.07, users: 0, status: "Verified", lastActive: "—", x: 30, y: 12 },
  { id: "tuv-rheinland",    name: "TÜV Rheinland",          type: "verifier",tier: 2, country: "Germany",     region: "EU",       size: "L", certifications: ["ISO 17021","OEKO-TEX"],              confidence: 0.91, risk: 0.08, users: 0, status: "Verified", lastActive: "—", x: 46, y: 18 },
  // Regulators / standards bodies
  { id: "textile-exchange", name: "Textile Exchange",       type: "regulator",tier:1, country: "USA",         region: "Americas", size: "S", certifications: [],                                    confidence: 0.97, risk: 0.03, users: 0, status: "Verified", lastActive: "—", x: 8,  y: 8  },
  { id: "gots",             name: "GOTS (Global Standard)", type: "regulator",tier:1, country: "Germany",     region: "EU",       size: "S", certifications: [],                                    confidence: 0.97, risk: 0.03, users: 0, status: "Verified", lastActive: "—", x: 94, y: 8  },
  { id: "zdhc",             name: "ZDHC Foundation",        type: "regulator",tier:1, country: "Netherlands", region: "EU",       size: "S", certifications: [],                                    confidence: 0.95, risk: 0.05, users: 0, status: "Verified", lastActive: "—", x: 6,  y: 92 },
  { id: "fair-wear",        name: "Fair Wear Foundation",   type: "regulator",tier:1, country: "Netherlands", region: "EU",       size: "S", certifications: [],                                    confidence: 0.95, risk: 0.05, users: 0, status: "Verified", lastActive: "—", x: 94, y: 92 },
];

// Edges sourced from publicly-disclosed certifications & sourcing partnerships.
export const EDGES: EcosystemEdge[] = [
  // Verification (certification bodies → certified orgs, per each org's public certification listings)
  { from: "control-union",  to: "patagonia",        kind: "verification", strength: 0.9, evidenceCount: 4 },
  { from: "control-union",  to: "eileen-fisher",    kind: "verification", strength: 0.9, evidenceCount: 4 },
  { from: "control-union",  to: "nudie-jeans",      kind: "verification", strength: 0.9, evidenceCount: 3 },
  { from: "control-union",  to: "arvind",           kind: "verification", strength: 0.85, evidenceCount: 3 },
  { from: "control-union",  to: "welspun",          kind: "verification", strength: 0.85, evidenceCount: 3 },
  { from: "control-union",  to: "calik-denim",      kind: "verification", strength: 0.85, evidenceCount: 3 },
  { from: "control-union",  to: "continental",      kind: "verification", strength: 0.85, evidenceCount: 3 },
  { from: "sgs",            to: "stella-mccartney", kind: "verification", strength: 0.85, evidenceCount: 3 },
  { from: "sgs",            to: "esquel",           kind: "verification", strength: 0.85, evidenceCount: 3 },
  { from: "bureau-veritas", to: "patagonia",        kind: "verification", strength: 0.8,  evidenceCount: 2 },
  { from: "intertek",       to: "texhong",          kind: "verification", strength: 0.7,  evidenceCount: 2 },
  { from: "tuv-rheinland",  to: "continental",      kind: "verification", strength: 0.8,  evidenceCount: 2 },

  // Supply (brand → supplier, based on public sustainability reports & sourcing maps)
  { from: "patagonia",        to: "arvind",       kind: "supply", strength: 0.85, evidenceCount: 4 },
  { from: "patagonia",        to: "calik-denim",  kind: "supply", strength: 0.75, evidenceCount: 3 },
  { from: "eileen-fisher",    to: "arvind",       kind: "supply", strength: 0.7,  evidenceCount: 2 },
  { from: "stella-mccartney", to: "esquel",       kind: "supply", strength: 0.7,  evidenceCount: 2 },
  { from: "stella-mccartney", to: "continental",  kind: "supply", strength: 0.6,  evidenceCount: 2 },
  { from: "nudie-jeans",      to: "calik-denim",  kind: "supply", strength: 0.8,  evidenceCount: 3 },
  { from: "veja",             to: "continental",  kind: "supply", strength: 0.55, evidenceCount: 1 },
  { from: "arvind",           to: "texhong",      kind: "supply", strength: 0.6,  evidenceCount: 1 },
  { from: "welspun",          to: "texhong",      kind: "supply", strength: 0.5,  evidenceCount: 1 },

  // Standards bodies → orgs (partnership / signatory)
  { from: "gots",             to: "patagonia",        kind: "partnership", strength: 0.6, evidenceCount: 1 },
  { from: "gots",             to: "eileen-fisher",    kind: "partnership", strength: 0.6, evidenceCount: 1 },
  { from: "gots",             to: "nudie-jeans",      kind: "partnership", strength: 0.6, evidenceCount: 1 },
  { from: "gots",             to: "stella-mccartney", kind: "partnership", strength: 0.6, evidenceCount: 1 },
  { from: "gots",             to: "continental",      kind: "partnership", strength: 0.6, evidenceCount: 1 },
  { from: "textile-exchange", to: "patagonia",        kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "textile-exchange", to: "eileen-fisher",    kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "textile-exchange", to: "arvind",           kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "textile-exchange", to: "welspun",          kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "zdhc",             to: "arvind",           kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "zdhc",             to: "welspun",          kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "zdhc",             to: "calik-denim",      kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "fair-wear",        to: "nudie-jeans",      kind: "partnership", strength: 0.6, evidenceCount: 1 },
  { from: "fair-wear",        to: "continental",      kind: "partnership", strength: 0.6, evidenceCount: 1 },
];

// No demo users — real users are created via signup and stored in Supabase auth.users + public.org_members.
export type EcosystemUser = {
  id: string;
  name: string;
  email: string;
  orgId: string;
  role: "Brand Lead" | "Supplier Ops" | "Evidence Reviewer" | "Admin" | "Viewer";
  lastLogin: string;
  status: "Active" | "Invited" | "Suspended";
};

export const USERS: EcosystemUser[] = [];

export function orgById(id: string): EcosystemOrg | undefined {
  return ORGS.find((o) => o.id === id);
}
