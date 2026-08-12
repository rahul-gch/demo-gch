import type { Entity } from "./types";
import { ALL_ENTITIES as ENTITIES } from "./all-entities";

export interface EcosystemConnection {
  entity: Entity;
  role: "Upstream" | "Downstream" | "Verifier";
  relationship: string;
}

const TIER_ORDER = ["Tier 4", "Tier 3", "Tier 2", "Tier 1", "Tier 0"] as const;

/**
 * Organizations imported from the original registry carry showcase content.
 * Newly created organizations start empty and must feed in their own data.
 */
export function isSeededOrg(e: Entity): boolean {
  return e.isSeeded === true;
}

export function getEcosystemConnections(e: Entity): EcosystemConnection[] {
  if (!isSeededOrg(e)) return [];
  const rand = seed(e.id + ":eco");
  const idx = TIER_ORDER.indexOf(e.actorType);
  const upstreamTier = TIER_ORDER[Math.max(0, idx - 1)];
  const downstreamTier = TIER_ORDER[Math.min(TIER_ORDER.length - 1, idx + 1)];
  const pool = ENTITIES.filter((x) => x.id !== e.id);

  const pick = (n: number, filter: (x: Entity) => boolean): Entity[] => {
    const matches = pool.filter(filter);
    const out: Entity[] = [];
    while (out.length < n && matches.length) {
      const i = Math.floor(rand() * matches.length);
      out.push(matches.splice(i, 1)[0]);
    }
    return out;
  };

  const upstream = pick(3, (x) => x.actorType === upstreamTier && x.entityType !== "Certification Body");
  const downstream = pick(2, (x) => x.actorType === downstreamTier && x.entityType !== "Certification Body");
  const verifiers = pick(2, (x) => x.entityType === "Certification Body" || x.entityType === "Sustainability Partner");

  return [
    ...upstream.map((entity) => ({ entity, role: "Upstream" as const, relationship: `Supplies ${e.name.split(" ")[0]}` })),
    ...downstream.map((entity) => ({ entity, role: "Downstream" as const, relationship: `Buyer of ${e.name.split(" ")[0]} output` })),
    ...verifiers.map((entity) => ({ entity, role: "Verifier" as const, relationship: "Audits and certification" })),
  ];
}

import { getMatchesFor } from "./matchmaking";

export interface MatchSuggestion {
  entity: Entity;
  score: number;
  reasons: string[];
}

export function getMatchSuggestions(e: Entity): MatchSuggestion[] {
  return getMatchesFor(e, 8, 0).map((m) => ({ entity: m.entity, score: m.score, reasons: m.reasons }));
}



export const SHOWCASE_IDS = [
  "gch-nike",
  "gch-hm",
  "gch-mands",
  "gch-primark",
  "gch-170",
  "gch-123",
  ...Array.from({ length: 20 }, (_, i) => `gch-${String(i + 1).padStart(3, "0")}`),
];

export function isShowcase(id: string) {
  return SHOWCASE_IDS.includes(id);
}

// Deterministic pseudo-random based on entity id, so the same entity always
// shows the same mock numbers.
function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

export interface MockKpis {
  activeOrders: number;
  ordersSpark: number[];
  onTimeDelivery: number;
  onTimeTrend: number;
  monthlyVolume: { month: string; value: number }[];
  materialMix: { label: string; value: number }[];
}

const EMPTY_KPIS: MockKpis = {
  activeOrders: 0,
  ordersSpark: [],
  onTimeDelivery: 0,
  onTimeTrend: 0,
  monthlyVolume: [],
  materialMix: [],
};

export function getMockKpis(e: Entity): MockKpis {
  if (!isSeededOrg(e)) return EMPTY_KPIS;
  const rand = seed(e.id);
  const base = 30 + Math.floor(rand() * 80);
  const ordersSpark = Array.from({ length: 12 }, () =>
    Math.max(5, Math.round(base * (0.6 + rand() * 0.9))),
  );
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyVolume = months.map((m) => ({
    month: m,
    value: Math.round(base * (0.7 + rand() * 1.2)),
  }));

  const mats =
    e.materials.length > 0
      ? e.materials
      : ["Organic Cotton", "Recycled Polyester", "Tencel", "Linen"];
  const materialMix = mats.slice(0, 5).map((label) => ({
    label,
    value: Math.round(20 + rand() * 80),
  }));

  return {
    activeOrders: Math.max(2, Math.round(base / 5)),
    ordersSpark,
    onTimeDelivery: 78 + Math.floor(rand() * 20),
    onTimeTrend: Math.round((rand() - 0.4) * 8),
    monthlyVolume,
    materialMix,
  };
}

export interface MockActivity {
  id: string;
  kind: "upload" | "review" | "score" | "message" | "edit";
  text: string;
  at: string;
}

export function getMockActivity(_e: Entity): MockActivity[] {
  return [];
}

