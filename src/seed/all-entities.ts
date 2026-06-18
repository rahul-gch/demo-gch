// Combines auto-generated ENTITIES with manually curated showcase orgs
// (e.g. NIKE). Routes and seed helpers should import from here instead
// of src/seed/entities.ts so the curated additions are always included.
import type { Entity } from "./types";
import { ENTITIES as BASE_ENTITIES } from "./entities";
import { NIKE } from "./nike";
import { HM } from "./hm";
import { MANDS } from "./mands";
import { PRIMARK } from "./primark";

export const ALL_ENTITIES: Entity[] = [NIKE, HM, MANDS, PRIMARK, ...BASE_ENTITIES];

import { applyOverride } from "./org-overrides";

export function getEntity(id: string): Entity | undefined {
  const base = ALL_ENTITIES.find((e) => e.id === id);
  return base ? applyOverride(base) : undefined;
}

export const summaryMetrics = {
  total: ALL_ENTITIES.length,
  totalRegistry: ALL_ENTITIES.length,
  seededVisible: ALL_ENTITIES.length,
  verified: ALL_ENTITIES.filter((e) => e.verificationStatus === "Verified").length,
  pending: ALL_ENTITIES.filter((e) => e.verificationStatus === "Pending").length,
  incomplete: ALL_ENTITIES.filter((e) => e.verificationStatus === "Incomplete").length,
  flagged: ALL_ENTITIES.filter((e) => e.verificationStatus === "Flagged").length,
  highRisk: ALL_ENTITIES.filter((e) => e.riskLevel === "High").length,
  avgConfidence: Math.round(
    ALL_ENTITIES.reduce((s, e) => s + e.confidenceScore, 0) / ALL_ENTITIES.length,
  ),
  avgCompleteness: Math.round(
    ALL_ENTITIES.reduce((s, e) => s + e.profileCompleteness, 0) / ALL_ENTITIES.length,
  ),
  countries: new Set(ALL_ENTITIES.map((e) => e.country)).size,
  missingTotal: ALL_ENTITIES.reduce((s, e) => s + e.missingDataCount, 0),
  matchmakingReady: ALL_ENTITIES.filter((e) => e.matchmakingReadiness >= 60).length,
};

export const ENTITY_TYPE_BREAKDOWN: { type: string; count: number }[] = (() => {
  const map = new Map<string, number>();
  for (const e of ALL_ENTITIES) map.set(e.entityType, (map.get(e.entityType) || 0) + 1);
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
})();

export { ENTITY_TYPES } from "./entities";
