import { ORGS, EDGES, type EcosystemOrg, type OrgType, type SizeBand } from "./ecosystem-data";

export type MatchFactor =
  | "type"
  | "tier"
  | "geo"
  | "size"
  | "cert"
  | "history"
  | "confidence"
  | "risk";

export const FACTOR_META: Record<MatchFactor, { label: string; description: string }> = {
  type:       { label: "Type compatibility",   description: "Brand↔supplier↔verifier fit." },
  tier:       { label: "Tier adjacency",       description: "Prefer adjacent supply-chain tiers." },
  geo:        { label: "Geographic proximity", description: "Reward same country / region." },
  size:       { label: "Company size fit",     description: "Capacity match between partners." },
  cert:       { label: "Certification overlap",description: "Shared certifications." },
  history:    { label: "Co-order history",     description: "Prior interactions in the graph." },
  confidence: { label: "Confidence floor",     description: "Use the lower of both confidences." },
  risk:       { label: "Risk penalty",         description: "Subtract higher of both risk scores." },
};

export type MatchSettings = {
  enabled: boolean;
  weights: Record<MatchFactor, number>; // 0..100
  rules: Record<MatchFactor, boolean>;
  filters: {
    sameCountryOnly: boolean;
    minSize: SizeBand;            // candidate must be >= this
    sameRegionOnly: boolean;
    requiredCerts: string[];
    maxRisk: number;              // 0..1 ; candidates above are filtered out
  };
  thresholds: {
    autoAccept: number; // %
    reject: number;     // %
  };
};

export const MATCH_DEFAULTS: MatchSettings = {
  enabled: true,
  weights: {
    type: 90,
    tier: 80,
    geo: 55,
    size: 50,
    cert: 70,
    history: 45,
    confidence: 60,
    risk: 75,
  },
  rules: {
    type: true,
    tier: true,
    geo: true,
    size: true,
    cert: true,
    history: true,
    confidence: true,
    risk: true,
  },
  filters: {
    sameCountryOnly: false,
    minSize: "S",
    sameRegionOnly: false,
    requiredCerts: [],
    maxRisk: 0.8,
  },
  thresholds: {
    autoAccept: 85,
    reject: 60,
  },
};

const STORAGE_KEY = "gch_match_settings";

export function loadSettings(): MatchSettings {
  if (typeof window === "undefined") return MATCH_DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return MATCH_DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...MATCH_DEFAULTS, ...parsed, weights: { ...MATCH_DEFAULTS.weights, ...(parsed.weights ?? {}) }, rules: { ...MATCH_DEFAULTS.rules, ...(parsed.rules ?? {}) }, filters: { ...MATCH_DEFAULTS.filters, ...(parsed.filters ?? {}) }, thresholds: { ...MATCH_DEFAULTS.thresholds, ...(parsed.thresholds ?? {}) } };
  } catch {
    return MATCH_DEFAULTS;
  }
}

export function saveSettings(s: MatchSettings) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

/* ---------------- Scoring primitives ---------------- */

const SIZE_RANK: Record<SizeBand, number> = { S: 1, M: 2, L: 3 };

function typeFit(a: OrgType, b: OrgType): number {
  if (a === b) return a === "regulator" ? 0.2 : 0.3;
  const pair = [a, b].sort().join("|");
  // Strong fits
  if (pair === "brand|supplier") return 1;
  if (pair === "supplier|verifier") return 0.95;
  if (pair === "brand|verifier") return 0.9;
  if (pair === "regulator|supplier") return 0.7;
  if (pair === "brand|regulator") return 0.6;
  if (pair === "regulator|verifier") return 0.5;
  return 0.4;
}

function tierFit(a: number, b: number): number {
  const d = Math.abs(a - b);
  if (d === 1) return 1;
  if (d === 0) return 0.5;
  return Math.max(0, 1 - d * 0.4);
}

function geoFit(a: EcosystemOrg, b: EcosystemOrg): number {
  if (a.country === b.country) return 1;
  if (a.region === b.region) return 0.6;
  return 0.2;
}

function sizeFit(a: SizeBand, b: SizeBand): number {
  const d = Math.abs(SIZE_RANK[a] - SIZE_RANK[b]);
  return d === 0 ? 1 : d === 1 ? 0.7 : 0.35;
}

function certOverlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0.3;
  const set = new Set(a);
  const shared = b.filter((c) => set.has(c)).length;
  const denom = Math.max(1, Math.max(a.length, b.length));
  return shared / denom;
}

function historyFit(aId: string, bId: string): number {
  const e = EDGES.find(
    (e) => (e.from === aId && e.to === bId) || (e.from === bId && e.to === aId),
  );
  if (!e) return 0.1;
  return Math.min(1, 0.4 + e.strength * 0.6 + Math.min(e.evidenceCount, 10) * 0.04);
}

/* ---------------- Public scoring ---------------- */

export type ScoreBreakdown = {
  score: number; // 0..100
  parts: Partial<Record<MatchFactor, number>>;
};

export function scorePair(a: EcosystemOrg, b: EcosystemOrg, s: MatchSettings): ScoreBreakdown {
  if (!s.enabled || a.id === b.id) return { score: 0, parts: {} };

  // Hard filters
  if (s.filters.sameCountryOnly && a.country !== b.country) return { score: 0, parts: {} };
  if (s.filters.sameRegionOnly && a.region !== b.region) return { score: 0, parts: {} };
  if (SIZE_RANK[b.size] < SIZE_RANK[s.filters.minSize]) return { score: 0, parts: {} };
  if (b.risk > s.filters.maxRisk) return { score: 0, parts: {} };
  if (s.filters.requiredCerts.length > 0) {
    const has = s.filters.requiredCerts.every((c) => b.certifications.includes(c));
    if (!has) return { score: 0, parts: {} };
  }

  const raw: Partial<Record<MatchFactor, number>> = {};
  let total = 0;
  let weightSum = 0;

  const add = (f: MatchFactor, value: number, signed = false) => {
    if (!s.rules[f]) return;
    const w = s.weights[f] / 100;
    raw[f] = value;
    if (signed) total -= w * value;
    else total += w * value;
    if (!signed) weightSum += w;
  };

  add("type",       typeFit(a.type, b.type));
  add("tier",       tierFit(a.tier, b.tier));
  add("geo",        geoFit(a, b));
  add("size",       sizeFit(a.size, b.size));
  add("cert",       certOverlap(a.certifications, b.certifications));
  add("history",    historyFit(a.id, b.id));
  add("confidence", Math.min(a.confidence, b.confidence));
  add("risk",       Math.max(a.risk, b.risk), true);

  const norm = weightSum > 0 ? total / weightSum : 0;
  const score = Math.max(0, Math.min(100, Math.round(norm * 100)));
  return { score, parts: raw };
}

export function topMatches(orgId: string, s: MatchSettings, limit = 5) {
  const a = ORGS.find((o) => o.id === orgId);
  if (!a) return [];
  return ORGS
    .filter((b) => b.id !== orgId)
    .map((b) => ({ org: b, ...scorePair(a, b, s) }))
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

export function ecosystemMatchStats(s: MatchSettings) {
  let pairs = 0, auto = 0, review = 0, reject = 0;
  for (let i = 0; i < ORGS.length; i++) {
    for (let j = i + 1; j < ORGS.length; j++) {
      const r = scorePair(ORGS[i], ORGS[j], s);
      pairs++;
      if (r.score >= s.thresholds.autoAccept) auto++;
      else if (r.score >= s.thresholds.reject) review++;
      else reject++;
    }
  }
  return { pairs, auto, review, reject };
}

export const ALL_CERTS = ["GOTS", "RCS", "OEKO-TEX", "BlueSign", "SMETA 4P", "ZDHC", "ISO 17021"];
