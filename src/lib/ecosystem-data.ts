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
  confidence: number; // 0..1
  risk: number; // 0..1
  users: number;
  status: "Verified" | "Pending" | "Flagged";
  lastActive: string;
  // 2D layout coords (0..100) — pre-computed so graph stays stable
  x: number;
  y: number;
};

export type EcosystemEdge = {
  from: string;
  to: string;
  kind: "supply" | "verification" | "partnership";
  strength: number; // 0..1
  evidenceCount: number;
};

export const ORGS: EcosystemOrg[] = [
  // Brands (core)
  { id: "acme",   name: "Acme Apparel",       type: "brand",   tier: 1, country: "Portugal", region: "EU",       size: "L", certifications: ["GOTS", "RCS"],         confidence: 0.94, risk: 0.12, users: 24, status: "Verified", lastActive: "2m",  x: 50, y: 50 },
  { id: "lumon",  name: "Lumon Outerwear",    type: "brand",   tier: 1, country: "USA",      region: "Americas", size: "L", certifications: ["RCS", "BlueSign"],     confidence: 0.88, risk: 0.18, users: 19, status: "Verified", lastActive: "12m", x: 28, y: 32 },
  { id: "wayne",  name: "Wayne Heritage",     type: "brand",   tier: 1, country: "UK",       region: "EU",       size: "M", certifications: ["GOTS"],                confidence: 0.79, risk: 0.22, users: 9,  status: "Verified", lastActive: "1h",  x: 72, y: 30 },
  { id: "initech",name: "Initech Basics",     type: "brand",   tier: 1, country: "Germany",  region: "EU",       size: "M", certifications: ["GOTS", "OEKO-TEX"],    confidence: 0.71, risk: 0.31, users: 7,  status: "Pending",  lastActive: "3h",  x: 18, y: 68 },
  { id: "cyber",  name: "Cyberdyne Active",   type: "brand",   tier: 1, country: "Japan",    region: "APAC",     size: "M", certifications: ["BlueSign"],            confidence: 0.66, risk: 0.27, users: 5,  status: "Pending",  lastActive: "6h",  x: 82, y: 72 },

  // Suppliers — Tier 2
  { id: "northwind", name: "Northwind Mills",  type: "supplier", tier: 2, country: "Portugal", region: "EU",   size: "L", certifications: ["GOTS", "OEKO-TEX"], confidence: 0.82, risk: 0.21, users: 11, status: "Verified", lastActive: "8m",  x: 38, y: 42 },
  { id: "tyrell",    name: "Tyrell Dyeworks",  type: "supplier", tier: 2, country: "Portugal", region: "EU",   size: "M", certifications: ["GOTS", "BlueSign"],confidence: 0.77, risk: 0.24, users: 6,  status: "Verified", lastActive: "22m", x: 60, y: 22 },
  { id: "hooli",     name: "Hooli Knit",       type: "supplier", tier: 2, country: "Portugal", region: "EU",   size: "S", certifications: ["OEKO-TEX"],       confidence: 0.62, risk: 0.36, users: 4,  status: "Pending",  lastActive: "1h",  x: 50, y: 82 },
  { id: "stark",     name: "Stark Industries", type: "supplier", tier: 2, country: "USA",      region: "Americas", size: "L", certifications: ["RCS"],         confidence: 0.81, risk: 0.19, users: 14, status: "Verified", lastActive: "5m",  x: 10, y: 50 },
  { id: "globex",    name: "Globex CMT",       type: "supplier", tier: 2, country: "Mexico",   region: "Americas", size: "M", certifications: ["RCS", "GOTS"], confidence: 0.71, risk: 0.28, users: 8,  status: "Verified", lastActive: "30m", x: 22, y: 18 },

  // Suppliers — Tier 3 (raw)
  { id: "soylent",   name: "Soylent Fiber Co.",type: "supplier", tier: 3, country: "India",    region: "APAC",     size: "L", certifications: ["GOTS", "RCS"],  confidence: 0.74, risk: 0.26, users: 9,  status: "Verified", lastActive: "1h", x: 35, y: 88 },
  { id: "umbrella",  name: "Umbrella Dyehouse",type: "supplier", tier: 3, country: "China",    region: "APAC",     size: "L", certifications: [],               confidence: 0.39, risk: 0.71, users: 4,  status: "Flagged",  lastActive: "2d", x: 80, y: 84 },
  { id: "nakatomi",  name: "Nakatomi Spinning",type: "supplier", tier: 3, country: "Vietnam",  region: "APAC",     size: "M", certifications: ["OEKO-TEX"],     confidence: 0.58, risk: 0.42, users: 3,  status: "Pending",  lastActive: "4h", x: 90, y: 56 },
  { id: "weyland",   name: "Weyland Fiber",    type: "supplier", tier: 3, country: "Brazil",   region: "Americas", size: "M", certifications: ["RCS"],          confidence: 0.66, risk: 0.34, users: 5,  status: "Verified", lastActive: "1h", x: 8, y: 78 },

  // Verifiers
  { id: "starkv",    name: "Stark Verification", type: "verifier", tier: 2, country: "UK",      region: "EU",       size: "M", certifications: ["SMETA 4P", "ISO 17021"], confidence: 0.91, risk: 0.08, users: 12, status: "Verified", lastActive: "9m",  x: 65, y: 58 },
  { id: "ouroboros", name: "Ouroboros Audit",    type: "verifier", tier: 2, country: "Netherlands", region: "EU",   size: "L", certifications: ["SMETA 4P", "ZDHC"],       confidence: 0.87, risk: 0.10, users: 16, status: "Verified", lastActive: "20m", x: 42, y: 60 },

  // Regulators
  { id: "ngo1",      name: "FairChain Council", type: "regulator", tier: 1, country: "Belgium", region: "EU",      size: "S", certifications: [],                          confidence: 0.95, risk: 0.05, users: 3,  status: "Verified", lastActive: "1d", x: 92, y: 14 },
  { id: "ngo2",      name: "Pacific Trade Reg.",type: "regulator", tier: 1, country: "Singapore", region: "APAC",  size: "S", certifications: [],                          confidence: 0.93, risk: 0.06, users: 2,  status: "Verified", lastActive: "1d", x: 6, y: 14 },
];

export const EDGES: EcosystemEdge[] = [
  // Acme supply chain
  { from: "acme", to: "northwind", kind: "supply", strength: 0.9, evidenceCount: 12 },
  { from: "acme", to: "tyrell",    kind: "supply", strength: 0.7, evidenceCount: 6 },
  { from: "acme", to: "hooli",     kind: "supply", strength: 0.5, evidenceCount: 0 }, // missing evidence
  { from: "northwind", to: "soylent", kind: "supply", strength: 0.8, evidenceCount: 5 },
  { from: "tyrell", to: "umbrella", kind: "supply", strength: 0.6, evidenceCount: 0 },
  { from: "hooli", to: "nakatomi", kind: "supply", strength: 0.4, evidenceCount: 1 },

  // Lumon
  { from: "lumon", to: "stark",  kind: "supply", strength: 0.85, evidenceCount: 9 },
  { from: "lumon", to: "globex", kind: "supply", strength: 0.6,  evidenceCount: 3 },
  { from: "stark", to: "weyland", kind: "supply", strength: 0.7, evidenceCount: 4 },

  // Wayne
  { from: "wayne", to: "tyrell", kind: "supply", strength: 0.55, evidenceCount: 2 },
  { from: "wayne", to: "northwind", kind: "supply", strength: 0.5, evidenceCount: 2 },

  // Initech
  { from: "initech", to: "hooli", kind: "supply", strength: 0.45, evidenceCount: 0 },
  { from: "initech", to: "soylent", kind: "supply", strength: 0.55, evidenceCount: 2 },

  // Cyberdyne
  { from: "cyber", to: "nakatomi", kind: "supply", strength: 0.6, evidenceCount: 3 },
  { from: "cyber", to: "umbrella", kind: "supply", strength: 0.35, evidenceCount: 0 },

  // Verifications
  { from: "starkv", to: "acme",       kind: "verification", strength: 0.9, evidenceCount: 8 },
  { from: "starkv", to: "northwind",  kind: "verification", strength: 0.8, evidenceCount: 6 },
  { from: "starkv", to: "wayne",      kind: "verification", strength: 0.7, evidenceCount: 4 },
  { from: "ouroboros", to: "lumon",   kind: "verification", strength: 0.85, evidenceCount: 7 },
  { from: "ouroboros", to: "stark",   kind: "verification", strength: 0.7, evidenceCount: 5 },
  { from: "ouroboros", to: "tyrell",  kind: "verification", strength: 0.6, evidenceCount: 3 },
  { from: "ouroboros", to: "initech", kind: "verification", strength: 0.55, evidenceCount: 2 },

  // Regulator oversight (partnership)
  { from: "ngo1", to: "acme",   kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "ngo1", to: "wayne",  kind: "partnership", strength: 0.5, evidenceCount: 1 },
  { from: "ngo2", to: "cyber",  kind: "partnership", strength: 0.4, evidenceCount: 1 },
  { from: "ngo2", to: "soylent",kind: "partnership", strength: 0.4, evidenceCount: 1 },
];

export type EcosystemUser = {
  id: string;
  name: string;
  email: string;
  orgId: string;
  role: "Brand Lead" | "Supplier Ops" | "Evidence Reviewer" | "Admin" | "Viewer";
  lastLogin: string;
  status: "Active" | "Invited" | "Suspended";
};

export const USERS: EcosystemUser[] = [
  { id: "u1", name: "Rahul Mehta",     email: "rahul@acme-apparel.com",   orgId: "acme",      role: "Brand Lead",        lastLogin: "2m",  status: "Active" },
  { id: "u2", name: "Priya Shah",      email: "priya@acme-apparel.com",   orgId: "acme",      role: "Viewer",            lastLogin: "1h",  status: "Active" },
  { id: "u3", name: "George Almeida",  email: "george@northwind.pt",      orgId: "northwind", role: "Supplier Ops",      lastLogin: "8m",  status: "Active" },
  { id: "u4", name: "Joana Pires",     email: "joana@northwind.pt",       orgId: "northwind", role: "Viewer",            lastLogin: "2d",  status: "Active" },
  { id: "u5", name: "Maria Costa",     email: "maria@gch-verify.eu",      orgId: "starkv",    role: "Evidence Reviewer", lastLogin: "9m",  status: "Active" },
  { id: "u6", name: "Tom Becker",      email: "tom@ouroboros.nl",         orgId: "ouroboros", role: "Evidence Reviewer", lastLogin: "20m", status: "Active" },
  { id: "u7", name: "Liu Wei",         email: "liu@umbrella.cn",          orgId: "umbrella",  role: "Supplier Ops",      lastLogin: "2d",  status: "Suspended" },
  { id: "u8", name: "Anika Rao",       email: "anika@soylent.in",         orgId: "soylent",   role: "Supplier Ops",      lastLogin: "1h",  status: "Active" },
  { id: "u9", name: "Diego Alvarez",   email: "diego@globex.mx",          orgId: "globex",    role: "Supplier Ops",      lastLogin: "30m", status: "Active" },
  { id: "u10", name: "Hiro Tanaka",    email: "hiro@cyberdyne.jp",        orgId: "cyber",     role: "Brand Lead",        lastLogin: "6h",  status: "Active" },
  { id: "u11", name: "Sara Klein",     email: "sara@lumon.com",           orgId: "lumon",     role: "Brand Lead",        lastLogin: "12m", status: "Active" },
  { id: "u12", name: "Bruce Lin",      email: "bruce@wayne-heritage.uk",  orgId: "wayne",     role: "Brand Lead",        lastLogin: "1h",  status: "Active" },
  { id: "u13", name: "Mira Hoffmann",  email: "mira@initech.de",          orgId: "initech",   role: "Brand Lead",        lastLogin: "3h",  status: "Active" },
  { id: "u14", name: "Renato Souza",   email: "renato@weyland.br",        orgId: "weyland",   role: "Supplier Ops",      lastLogin: "1h",  status: "Active" },
  { id: "u15", name: "Nguyen Linh",    email: "linh@nakatomi.vn",         orgId: "nakatomi",  role: "Supplier Ops",      lastLogin: "4h",  status: "Invited" },
  { id: "u16", name: "Eva Martins",    email: "eva@tyrell.pt",            orgId: "tyrell",    role: "Supplier Ops",      lastLogin: "22m", status: "Active" },
  { id: "u17", name: "Ana Faria",      email: "ana@hooli.pt",             orgId: "hooli",     role: "Supplier Ops",      lastLogin: "1h",  status: "Active" },
  { id: "u18", name: "John Pierce",    email: "john@stark-ind.com",       orgId: "stark",     role: "Supplier Ops",      lastLogin: "5m",  status: "Active" },
  { id: "u19", name: "Claire Devereux",email: "claire@fairchain.eu",      orgId: "ngo1",      role: "Viewer",            lastLogin: "1d",  status: "Active" },
  { id: "u20", name: "Wei Tan",        email: "wei@pacificreg.sg",        orgId: "ngo2",      role: "Viewer",            lastLogin: "1d",  status: "Active" },
  { id: "u21", name: "GCH Admin",      email: "admin@gch.io",             orgId: "starkv",    role: "Admin",             lastLogin: "now", status: "Active" },
];

export function orgById(id: string): EcosystemOrg | undefined {
  return ORGS.find((o) => o.id === id);
}
