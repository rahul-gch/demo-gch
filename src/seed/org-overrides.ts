// localStorage-backed per-org profile overrides. Merged into the entity
// when read through getEntity() so dashboards/matchmaking pick them up.
import type { Entity } from "./types";

export interface OrgOverride {
  name?: string;
  country?: string;
  region?: string;
  city?: string;
  leadTimeDays?: number;
  moq?: string;
  capacity?: string;
  deliveryTimeframeDays?: number;
  onTimeRate?: number;
  avgDelayDays?: number;
  materials?: string[];
  capabilities?: string[];
  certifications?: string[];
  specializations?: string[];
}

const KEY = "gch.org-overrides.v1";

const isBrowser = () => typeof window !== "undefined";

function loadAll(): Record<string, OrgOverride> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, OrgOverride>) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getOverride(orgId: string): OrgOverride {
  return loadAll()[orgId] ?? {};
}

export function setOverride(orgId: string, patch: OrgOverride) {
  const all = loadAll();
  all[orgId] = { ...(all[orgId] ?? {}), ...patch };
  saveAll(all);
}

export function clearOverride(orgId: string) {
  const all = loadAll();
  delete all[orgId];
  saveAll(all);
}

export function applyOverride(entity: Entity): Entity {
  const o = getOverride(entity.id);
  if (!o || Object.keys(o).length === 0) return entity;
  return { ...entity, ...o } as Entity;
}
