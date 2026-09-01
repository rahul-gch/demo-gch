// Live organization registry, hydrated from the database.
//
// The registry keeps stable module-level references (ALL_ENTITIES,
// summaryMetrics, ENTITY_TYPE_BREAKDOWN) that are mutated in place when data
// arrives, so existing synchronous consumers keep working.
import type { Entity } from "./types";

export const ENTITY_TYPES = [
  "Brand",
  "Farmer",
  "Ginner",
  "Spinner",
  "Fabric Mill",
  "Dye House",
  "Garment Factory",
  "Logistics Provider",
  "Certification Body",
  "Sustainability Partner",
] as const;

export const ALL_ENTITIES: Entity[] = [];

const byId = new Map<string, Entity>();

export const summaryMetrics = {
  total: 0,
  totalRegistry: 0,
  seededVisible: 0,
  verified: 0,
  pending: 0,
  incomplete: 0,
  flagged: 0,
  highRisk: 0,
  avgConfidence: 0,
  avgCompleteness: 0,
  countries: 0,
  missingTotal: 0,
  matchmakingReady: 0,
};

export const ENTITY_TYPE_BREAKDOWN: { type: string; count: number }[] = [];

const hydrationListeners = new Set<() => void>();

/** Subscribe to registry hydration (used to reset derived caches). */
export function onRegistryHydrated(fn: () => void): () => void {
  hydrationListeners.add(fn);
  return () => hydrationListeners.delete(fn);
}

export function isRegistryHydrated(): boolean {
  return ALL_ENTITIES.length > 0;
}

export function hydrateEntities(entities: Entity[]) {
  ALL_ENTITIES.length = 0;
  ALL_ENTITIES.push(...entities);

  byId.clear();
  for (const e of entities) {
    byId.set(e.id, e);
    if (e.orgUuid) byId.set(e.orgUuid, e);
    if (e.slug) byId.set(e.slug, e);
    if (e.gchNumber) byId.set(e.gchNumber, e);
  }

  const n = entities.length || 1;
  summaryMetrics.total = entities.length;
  summaryMetrics.totalRegistry = entities.length;
  summaryMetrics.seededVisible = entities.length;
  summaryMetrics.verified = entities.filter((e) => e.verificationStatus === "Verified").length;
  summaryMetrics.pending = entities.filter((e) => e.verificationStatus === "Pending").length;
  summaryMetrics.incomplete = entities.filter((e) => e.verificationStatus === "Incomplete").length;
  summaryMetrics.flagged = entities.filter((e) => e.verificationStatus === "Flagged").length;
  summaryMetrics.highRisk = entities.filter((e) => e.riskLevel === "High").length;
  summaryMetrics.avgConfidence = Math.round(
    entities.reduce((s, e) => s + e.confidenceScore, 0) / n,
  );
  summaryMetrics.avgCompleteness = Math.round(
    entities.reduce((s, e) => s + e.profileCompleteness, 0) / n,
  );
  summaryMetrics.countries = new Set(entities.map((e) => e.country).filter(Boolean)).size;
  summaryMetrics.missingTotal = entities.reduce((s, e) => s + e.missingDataCount, 0);
  summaryMetrics.matchmakingReady = entities.filter((e) => e.matchmakingReadiness >= 60).length;

  const map = new Map<string, number>();
  for (const e of entities) map.set(e.entityType, (map.get(e.entityType) || 0) + 1);
  ENTITY_TYPE_BREAKDOWN.length = 0;
  ENTITY_TYPE_BREAKDOWN.push(
    ...Array.from(map.entries()).map(([type, count]) => ({ type, count })),
  );

  for (const fn of hydrationListeners) fn();
}

export function getEntity(id: string): Entity | undefined {
  if (!id) return undefined;
  const base = byId.get(id);
  if (base) return base;

  const lower = id.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9]/g, "");

  const found = ALL_ENTITIES.find((e) => {
    if (e.id.toLowerCase() === lower) return true;
    if (e.orgUuid?.toLowerCase() === lower) return true;
    if (e.slug?.toLowerCase() === lower) return true;
    if (e.gchNumber?.toLowerCase() === lower) return true;
    if (e.name.toLowerCase() === lower) return true;
    if (e.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) return true;
    if (e.id.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) return true;
    if (e.gchNumber?.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) return true;
    return false;
  });

  return found;
}
