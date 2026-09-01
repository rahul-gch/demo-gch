import type { Entity, ActorType } from "./types";
import { ALL_ENTITIES as ENTITIES } from "./all-entities";
import { getKpisForEntity } from "./kpi";

const TIER_ORDER: ActorType[] = ["Tier 4", "Tier 3", "Tier 2", "Tier 1", "Tier 0"];

function tierComplementarity(a: Entity, b: Entity): number {
  const ai = TIER_ORDER.indexOf(a.actorType);
  const bi = TIER_ORDER.indexOf(b.actorType);
  if (ai < 0 || bi < 0) return 0;
  const diff = Math.abs(ai - bi);
  if (diff === 1) return 1; // adjacent tier — strongest fit
  if (diff === 2) return 0.6;
  if (diff === 0) return 0.2; // same tier — co-supply only
  return 0.3;
}

function overlap<T>(a: T[], b: T[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  return a.filter((x) => setB.has(x)).length;
}

function regionProximity(a: Entity, b: Entity): number {
  if (a.country && a.country === b.country) return 1;
  if (a.region && a.region === b.region) return 0.6;
  return 0.2;
}

function kpiCompatibility(a: Entity, b: Entity): number {
  const ak = getKpisForEntity(a)
    .filter((k) => k.reported && k.confidence >= 50)
    .map((k) => k.kpi.category);
  const bk = getKpisForEntity(b)
    .filter((k) => k.reported && k.confidence >= 50)
    .map((k) => k.kpi.category);
  if (!ak.length || !bk.length) return 0;
  const setB = new Set(bk);
  const shared = ak.filter((c) => setB.has(c)).length;
  return Math.min(1, shared / 4);
}

function capacityFit(a: Entity, b: Entity): number {
  const ca = parseInt(String(a.capacity).replace(/\D/g, ""), 10);
  const cb = parseInt(String(b.capacity).replace(/\D/g, ""), 10);
  if (!ca || !cb) return 0.4;
  const ratio = Math.min(ca, cb) / Math.max(ca, cb);
  return ratio;
}

function deliveryFit(a: Entity, b: Entity): number {
  const la = a.leadTimeDays || a.deliveryTimeframeDays || 30;
  const lb = b.leadTimeDays || b.deliveryTimeframeDays || 30;
  const otr = ((a.onTimeRate ?? 85) + (b.onTimeRate ?? 85)) / 2;
  const delay = ((a.avgDelayDays ?? 2) + (b.avgDelayDays ?? 2)) / 2;
  // Closer lead times = better fit. 0 diff → 1.0, 60d diff → 0.
  const leadProx = Math.max(0, 1 - Math.abs(la - lb) / 60);
  const reliability = Math.min(1, Math.max(0, otr / 100));
  const delayPenalty = Math.min(0.5, delay / 20); // up to 0.5 penalty
  return Math.max(0, leadProx * 0.5 + reliability * 0.5 - delayPenalty);
}

export interface MatchScore {
  entity: Entity;
  score: number;
  breakdown: {
    material: number;
    cert: number;
    tier: number;
    region: number;
    kpi: number;
    capacity: number;
    delivery: number;
  };
  reasons: string[];
}

export function scoreMatch(a: Entity, b: Entity): MatchScore {
  const matN = overlap(a.materials || [], b.materials || []);
  const certN = overlap(a.certifications || [], b.certifications || []);
  const tier = tierComplementarity(a, b);
  const region = regionProximity(a, b);
  const kpi = kpiCompatibility(a, b);
  const cap = capacityFit(a, b);
  const delivery = deliveryFit(a, b);

  const matMax = Math.max(1, Math.min((a.materials || []).length, (b.materials || []).length));
  const certMax = Math.max(1, Math.min((a.certifications || []).length, (b.certifications || []).length));

  const breakdown = {
    material: 18 * (matN / matMax),
    cert: 12 * (certN / certMax),
    tier: 18 * tier,
    region: 12 * region,
    kpi: 12 * kpi,
    capacity: 13 * cap,
    delivery: 15 * delivery,
  };
  const score = Math.round(
    breakdown.material +
      breakdown.cert +
      breakdown.tier +
      breakdown.region +
      breakdown.kpi +
      breakdown.capacity +
      breakdown.delivery,
  );

  const reasons: string[] = [];
  if (matN) reasons.push(`${matN} shared material${matN > 1 ? "s" : ""}`);
  if (certN) reasons.push(`${certN} shared certification${certN > 1 ? "s" : ""}`);
  if (tier >= 1) reasons.push("Adjacent tier — direct supply fit");
  else if (tier >= 0.6) reasons.push("Near-tier — viable two-step fit");
  if (region === 1) reasons.push(`Same country (${a.country})`);
  else if (region >= 0.6) reasons.push("Same region");
  if (kpi >= 0.5) reasons.push("Strong KPI category overlap");
  if (delivery >= 0.7) reasons.push("Reliable delivery & matched lead time");
  else if (delivery >= 0.45) reasons.push("Compatible lead times");
  if (!reasons.length) reasons.push("Complementary profile");

  return { entity: b, score: Math.min(100, score), breakdown, reasons };
}

export function getMatchesFor(entity: Entity, limit = 20, minScore = 0): MatchScore[] {
  let target = entity;
  if (!target.materials || target.materials.length === 0) {
    target = {
      ...target,
      materials: ["Cotton", "Denim", "Wool", "Viscose", "Polyester", "Linen"],
      certifications: ["GOTS", "GRS", "OEKO-TEX"],
    };
  }
  let matches = ENTITIES.filter((x) => x.id !== target.id)
    .map((b) => scoreMatch(target, b))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    matches = ENTITIES.filter((x) => x.id !== target.id)
      .map((b) => scoreMatch(target, b))
      .sort((a, b) => b.score - a.score);
  }

  return matches.slice(0, limit);
}

export interface PairMatch extends MatchScore {
  from: Entity;
}

export function getTopPairs(limit = 50, minScore = 60): PairMatch[] {
  const all: PairMatch[] = [];
  for (let i = 0; i < ENTITIES.length; i++) {
    for (let j = i + 1; j < ENTITIES.length; j++) {
      const m = scoreMatch(ENTITIES[i], ENTITIES[j]);
      if (m.score >= minScore) all.push({ ...m, from: ENTITIES[i] });
    }
  }
  return all.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const MATCH_WEIGHTS: { key: string; label: string; weight: number; description: string }[] =
  [
    {
      key: "material",
      label: "Material overlap",
      weight: 18,
      description: "How many raw materials the two organizations share (cotton, denim, wool…).",
    },
    {
      key: "tier",
      label: "Tier complementarity",
      weight: 18,
      description:
        "Whether the tiers fit as a natural supply step (brand ↔ garment factory ↔ mill ↔ farm).",
    },
    {
      key: "delivery",
      label: "Delivery reliability",
      weight: 15,
      description: "Blend of on-time rate, average delay and how closely their lead times match.",
    },
    {
      key: "capacity",
      label: "Capacity fit",
      weight: 13,
      description: "Ratio between their production capacities — closer is better.",
    },
    {
      key: "cert",
      label: "Certification overlap",
      weight: 12,
      description: "Shared standards like GOTS, GRS, OEKO-TEX or SA8000.",
    },
    {
      key: "region",
      label: "Region proximity",
      weight: 12,
      description: "Same country scores highest, same region next, otherwise reduced.",
    },
    {
      key: "kpi",
      label: "KPI category overlap",
      weight: 12,
      description: "How many reported sustainability KPI categories align.",
    },
  ];
