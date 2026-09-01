// Decommissioned: Profile updates now persist directly to the database via TanStack Server Functions.
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

export function getOverride(_orgId: string): OrgOverride {
  return {};
}

export function setOverride(_orgId: string, _patch: OrgOverride) {}

export function applyOverride<T extends Entity>(entity: T): T {
  return entity;
}
