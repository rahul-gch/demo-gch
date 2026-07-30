// Network Health & Readiness Index (NHRI)
// A single 0-100 score per entity, deterministically derived from seed data.
// This is the signature "credit score" of Global Chain Hub.
import type { Entity } from "@/seed/types";
import { ALL_ENTITIES, onRegistryHydrated } from "@/seed/all-entities";

export type NhriBand = "Excellent" | "Strong" | "Developing" | "At Risk";

export interface NhriPillar {
  key: string;
  label: string;
  value: number; // 0-100 (component score)
  weight: number; // sum of weights = 100
  contribution: number; // value * weight / 100
}

export interface NhriResult {
  score: number;
  band: NhriBand;
  bandTone: "emerald" | "sky" | "amber" | "red";
  pillars: NhriPillar[];
  topDrags: NhriPillar[];
  topLifts: NhriPillar[];
  deltaVsPeers: number;
  globalRank: number;
  totalRanked: number;
}

const WEIGHTS = {
  profile: 20,
  compliance: 18,
  supplyChain: 15,
  connectivity: 12,
  certifications: 10,
  projectActivity: 10,
  aiConfidence: 10,
  freshness: 5,
} as const;

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

// Deterministic per-entity pseudo-random for freshness/activity signals.
function seed(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

function pillarValues(e: Entity) {
  const profile = clamp(e.profileCompleteness);
  const verifiedRatio =
    e.certificationDetails.length > 0
      ? e.verifiedCertCount / Math.max(1, e.certificationDetails.length)
      : 0.5;
  const expiredPenalty = Math.min(30, e.expiredCertCount * 10);
  const compliance = clamp(verifiedRatio * 100 - expiredPenalty + (e.verificationStatus === "Verified" ? 10 : 0));
  const supplyChain = clamp(
    e.traceabilityReadiness * 0.7 + (e.actorType === "Tier 0" ? 20 : e.actorType === "Tier 1" ? 15 : 10),
  );
  const connectivity = clamp(e.matchmakingReadiness);
  const certifications = clamp(Math.min(100, e.certifications.length * 18 + 10));
  const rand = seed(e.id);
  const projectActivity = clamp(40 + Math.round(rand() * 55));
  const aiConfidence = clamp(e.confidenceScore);
  const freshness = clamp(55 + Math.round(rand() * 40) - expiredPenalty);
  return { profile, compliance, supplyChain, connectivity, certifications, projectActivity, aiConfidence, freshness };
}

export function computeNhri(e: Entity): NhriResult {
  const v = pillarValues(e);
  const pillars: NhriPillar[] = [
    { key: "profile", label: "Profile", value: v.profile, weight: WEIGHTS.profile, contribution: (v.profile * WEIGHTS.profile) / 100 },
    { key: "compliance", label: "Compliance", value: v.compliance, weight: WEIGHTS.compliance, contribution: (v.compliance * WEIGHTS.compliance) / 100 },
    { key: "supplyChain", label: "Supply Chain", value: v.supplyChain, weight: WEIGHTS.supplyChain, contribution: (v.supplyChain * WEIGHTS.supplyChain) / 100 },
    { key: "connectivity", label: "Connectivity", value: v.connectivity, weight: WEIGHTS.connectivity, contribution: (v.connectivity * WEIGHTS.connectivity) / 100 },
    { key: "certifications", label: "Certifications", value: v.certifications, weight: WEIGHTS.certifications, contribution: (v.certifications * WEIGHTS.certifications) / 100 },
    { key: "projectActivity", label: "Project Activity", value: v.projectActivity, weight: WEIGHTS.projectActivity, contribution: (v.projectActivity * WEIGHTS.projectActivity) / 100 },
    { key: "aiConfidence", label: "AI Confidence", value: v.aiConfidence, weight: WEIGHTS.aiConfidence, contribution: (v.aiConfidence * WEIGHTS.aiConfidence) / 100 },
    { key: "freshness", label: "Data Freshness", value: v.freshness, weight: WEIGHTS.freshness, contribution: (v.freshness * WEIGHTS.freshness) / 100 },
  ];
  const score = Math.round(pillars.reduce((s, p) => s + p.contribution, 0));
  const { band, bandTone } = bandFor(score);

  const sortedAsc = [...pillars].sort((a, b) => a.value - b.value);
  const sortedDesc = [...pillars].sort((a, b) => b.value - a.value);

  const rank = getGlobalRank(e.id);
  const peers = ALL_ENTITIES.filter((x) => x.entityType === e.entityType);
  const peerAvg =
    peers.length > 0
      ? Math.round(peers.reduce((s, x) => s + quickScore(x), 0) / peers.length)
      : score;

  return {
    score,
    band,
    bandTone,
    pillars,
    topDrags: sortedAsc.slice(0, 3),
    topLifts: sortedDesc.slice(0, 3),
    deltaVsPeers: score - peerAvg,
    globalRank: rank.rank,
    totalRanked: rank.total,
  };
}

function bandFor(score: number): { band: NhriBand; bandTone: NhriResult["bandTone"] } {
  if (score >= 85) return { band: "Excellent", bandTone: "emerald" };
  if (score >= 70) return { band: "Strong", bandTone: "sky" };
  if (score >= 55) return { band: "Developing", bandTone: "amber" };
  return { band: "At Risk", bandTone: "red" };
}

// Lightweight score used only to compute the global ranking; avoids
// pulling in the whole peer distribution on every call.
function quickScore(e: Entity): number {
  const v = pillarValues(e);
  return Math.round(
    (v.profile * WEIGHTS.profile +
      v.compliance * WEIGHTS.compliance +
      v.supplyChain * WEIGHTS.supplyChain +
      v.connectivity * WEIGHTS.connectivity +
      v.certifications * WEIGHTS.certifications +
      v.projectActivity * WEIGHTS.projectActivity +
      v.aiConfidence * WEIGHTS.aiConfidence +
      v.freshness * WEIGHTS.freshness) /
      100,
  );
}

let _rankCache: Map<string, number> | null = null;
onRegistryHydrated(() => {
  _rankCache = null;
});

function ensureRank() {
  if (_rankCache) return _rankCache;
  const scored = ALL_ENTITIES.map((e) => ({ id: e.id, s: quickScore(e) }));
  scored.sort((a, b) => b.s - a.s);
  const map = new Map<string, number>();
  scored.forEach((x, i) => map.set(x.id, i + 1));
  _rankCache = map;
  return map;
}

export function getGlobalRank(id: string): { rank: number; total: number } {
  const map = ensureRank();
  return { rank: map.get(id) ?? ALL_ENTITIES.length, total: ALL_ENTITIES.length };
}

export function bandBadgeClasses(tone: NhriResult["bandTone"]): string {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

export function bandBarClasses(tone: NhriResult["bandTone"]): string {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500";
    case "sky":
      return "bg-sky-500";
    case "amber":
      return "bg-amber-500";
    case "red":
      return "bg-red-500";
  }
}

// Six-pillar simplified view for the health score bar.
export function healthBars(nhri: NhriResult) {
  const byKey = new Map(nhri.pillars.map((p) => [p.key, p]));
  const get = (k: string) => byKey.get(k)?.value ?? 0;
  return [
    { label: "Profile", value: get("profile") },
    { label: "Compliance", value: get("compliance") },
    { label: "Supply Chain", value: get("supplyChain") },
    { label: "Circularity", value: Math.round((get("supplyChain") + get("certifications")) / 2) },
    { label: "Visibility", value: get("connectivity") },
    { label: "Trust", value: get("aiConfidence") },
  ];
}

// Platform-wide aggregate — used by the Mission Control home page.
export function platformNhriAggregate() {
  const scores = ALL_ENTITIES.map((e) => quickScore(e));
  const avg = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
  const buckets = { Excellent: 0, Strong: 0, Developing: 0, "At Risk": 0 };
  for (const s of scores) {
    const { band } = bandFor(s);
    buckets[band] += 1;
  }
  const topMovers = [...ALL_ENTITIES]
    .map((e) => ({ entity: e, score: quickScore(e) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return { avg, buckets, topMovers };
}
