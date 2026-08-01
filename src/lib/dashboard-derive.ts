import type { Entity } from "@/seed/types";
import { ALL_ENTITIES } from "@/seed/all-entities";
import { getEcosystemConnections, getMatchSuggestions, isSeededOrg } from "@/seed/showcase";

export function greetingForNow(): { greet: string; icon: "sun" | "moon" | "sunset" } {
  const h = new Date().getHours();
  if (h < 5) return { greet: "Good evening", icon: "moon" };
  if (h < 12) return { greet: "Good morning", icon: "sun" };
  if (h < 18) return { greet: "Good afternoon", icon: "sun" };
  return { greet: "Good evening", icon: "sunset" };
}

export interface AiSummary {
  missingDocs: number;
  matches: number;
  attentionProjects: number;
  updatedCerts: number;
  paragraph: string;
}

export function buildAiSummary(e: Entity, healthScore: number, userName = "there"): AiSummary {
  if (!isSeededOrg(e)) {
    const missing = buildMissingFields(e).length;
    return {
      missingDocs: missing,
      matches: 0,
      attentionProjects: 0,
      updatedCerts: e.verifiedCertCount,
      paragraph:
        `${greetingForNow().greet}, ${userName}. ${e.name} is a new organization on Global Chain Hub. ` +
        `Complete your profile${missing ? ` — ${missing} field${missing === 1 ? "" : "s"} still missing` : ""} ` +
        `to unlock matchmaking, readiness scoring and partner discovery.`,
    };
  }
  const missingDocs = Math.max(0, e.missingDataCount);
  const matches = Math.min(6, getMatchSuggestions(e).length);
  const conns = getEcosystemConnections(e);
  const attentionProjects = Math.max(1, Math.round(conns.length / 4));
  const updatedCerts = e.verifiedCertCount;

  const paragraph =
    `${greetingForNow().greet}, ${userName}. ${e.name}'s Network Health score is ${healthScore}. ` +
    `Today the platform surfaced ${missingDocs} missing data ${missingDocs === 1 ? "point" : "points"}, ` +
    `${matches} fresh partner ${matches === 1 ? "match" : "matches"}, ${attentionProjects} project ${
      attentionProjects === 1 ? "signal" : "signals"
    } needing attention, and ${updatedCerts} supplier certification ${
      updatedCerts === 1 ? "update" : "updates"
    }.`;
  return { missingDocs, matches, attentionProjects, updatedCerts, paragraph };
}

export interface CriticalAction {
  id: string;
  tone: "amber" | "sky" | "red";
  title: string;
  detail: string;
  cta: string;
  href?: string;
}

export function buildCriticalActions(e: Entity): CriticalAction[] {
  if (!isSeededOrg(e)) {
    const missing = buildMissingFields(e);
    return [
      {
        id: "profile",
        tone: missing.length > 4 ? "amber" : "sky",
        title: missing.length ? `Complete ${missing.length} profile field${missing.length === 1 ? "" : "s"}` : "Profile complete",
        detail: missing.length ? missing.slice(0, 3).map((m) => m.label).join(" · ") : "All core profile fields are filled in.",
        cta: "Edit profile",
      },
      {
        id: "certs",
        tone: e.certifications.length ? "sky" : "amber",
        title: e.certifications.length ? `${e.certifications.length} certification${e.certifications.length === 1 ? "" : "s"} listed` : "Add your certifications",
        detail: "Upload certificates so partners can verify your organization.",
        cta: "Upload",
      },
      {
        id: "ops",
        tone: e.moq && e.capacity ? "sky" : "amber",
        title: e.moq && e.capacity ? "Operations details added" : "Add MOQ, capacity and lead time",
        detail: "Operational data powers matchmaking with the right partners.",
        cta: "Add details",
      },
    ];
  }
  const expiring = e.certificationDetails.filter((c) => c.status !== "Verified").slice(0, 1)[0];
  const matches = getMatchSuggestions(e);
  const risk = e.riskLevel;
  return [
    {
      id: "cert",
      tone: expiring?.status === "Expired" ? "red" : "amber",
      title: expiring ? `${expiring.name} needs renewal` : "All certificates current",
      detail: expiring
        ? `${expiring.category} · expires ${expiring.expiryDate || "soon"}`
        : "No certification action required today.",
      cta: "Review",
    },
    {
      id: "matches",
      tone: "sky",
      title: `${matches.length} new partner ${matches.length === 1 ? "match" : "matches"}`,
      detail: matches[0] ? `Top: ${matches[0].entity.name} · ${matches[0].score}% fit` : "No matches yet.",
      cta: "Open",
    },
    {
      id: "risk",
      tone: risk === "High" ? "red" : risk === "Medium" ? "amber" : "sky",
      title: `Supply chain risk: ${risk}`,
      detail:
        risk === "High"
          ? "Two upstream suppliers flagged for climate volatility this week."
          : "Ecosystem is stable — continue routine monitoring.",
      cta: "Investigate",
    },
  ];
}

export interface EcosystemCounts {
  organizations: number;
  countries: number;
  suppliers: number;
  research: number;
  ngos: number;
  auditors: number;
  certifiers: number;
}

const EMPTY_ECOSYSTEM: EcosystemCounts = {
  organizations: 0,
  countries: 0,
  suppliers: 0,
  research: 0,
  ngos: 0,
  auditors: 0,
  certifiers: 0,
};

export function buildEcosystemCounts(e: Entity): EcosystemCounts {
  if (!isSeededOrg(e)) return EMPTY_ECOSYSTEM;
  const conns = getEcosystemConnections(e).map((c) => c.entity);
  const set = new Set(conns.map((c) => c.id));
  const list = ALL_ENTITIES.filter((x) => set.has(x.id));
  return {
    organizations: list.length + Math.round(list.length * 1.8), // representative reach
    countries: new Set(list.map((x) => x.country)).size,
    suppliers: list.filter((x) => x.actorType !== "Tier 0").length,
    research: list.filter((x) => x.entityType === "Sustainability Partner").length + 2,
    ngos: list.filter((x) => x.entityType === "Sustainability Partner").length,
    auditors: list.filter((x) => x.entityType === "Certification Body").length,
    certifiers: list.filter((x) => x.entityType === "Certification Body").length,
  };
}

export interface MissingField {
  key: string;
  label: string;
  estMinutes: number;
  cta: "Upload" | "Edit" | "Estimate";
}

const FIELD_META: Record<string, { label: string; est: number; cta: MissingField["cta"] }> = {
  address: { label: "Factory address", est: 2, cta: "Edit" },
  city: { label: "City", est: 1, cta: "Edit" },
  zipCode: { label: "Zip code", est: 1, cta: "Edit" },
  region: { label: "State / Region", est: 1, cta: "Edit" },
  materials: { label: "Materials list", est: 3, cta: "Edit" },
  capabilities: { label: "Capabilities", est: 3, cta: "Edit" },
  certifications: { label: "ISO certificate", est: 5, cta: "Upload" },
  capacity: { label: "Production capacity", est: 2, cta: "Estimate" },
  moq: { label: "Minimum order quantity", est: 1, cta: "Edit" },
  governance: { label: "Governance statement", est: 4, cta: "Edit" },
  traceabilityNotes: { label: "Traceability notes", est: 4, cta: "Edit" },
  contacts: { label: "Primary contacts", est: 2, cta: "Edit" },
};

export function buildMissingFields(e: Entity): MissingField[] {
  const isMissing = (k: keyof Entity) => {
    const v = e[k] as unknown;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "string") return v.trim() === "";
    return v == null;
  };
  return (Object.keys(FIELD_META) as (keyof Entity & keyof typeof FIELD_META)[])
    .filter((k) => isMissing(k))
    .map((k) => ({ key: k, label: FIELD_META[k].label, estMinutes: FIELD_META[k].est, cta: FIELD_META[k].cta }));
}

export interface SupplyChainSnapshotData {
  suppliers: number;
  countries: number;
  risks: number;
  delays: number;
  certified: number;
  tiers: { label: string; value: number }[];
}

export function buildSupplyChainSnapshot(e: Entity): SupplyChainSnapshotData {
  if (!isSeededOrg(e)) {
    return { suppliers: 0, countries: 0, risks: 0, delays: 0, certified: 0, tiers: [] };
  }
  const conns = getEcosystemConnections(e).map((c) => c.entity);
  const suppliers = conns.length + 12;
  const countries = new Set(conns.map((c) => c.country)).size + 3;
  const risks = conns.filter((c) => c.riskLevel !== "Low").length + 1;
  const delays = Math.max(1, Math.round(conns.length / 3));
  const certified = conns.filter((c) => c.verificationStatus === "Verified").length + 2;
  const tiers = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"].map((t) => ({
    label: t,
    value: conns.filter((c) => c.actorType === t).length + 2,
  }));
  return { suppliers, countries, risks, delays, certified, tiers };
}

export interface ReadinessBreakdownData {
  overall: number;
  bars: { label: string; value: number }[];
}

export function buildReadiness(e: Entity, nhriScore: number): ReadinessBreakdownData {
  if (!isSeededOrg(e)) {
    return {
      overall: Math.round((nhriScore + e.matchmakingReadiness + e.kpiReadiness) / 3),
      bars: [
        { label: "Matchmaking", value: e.matchmakingReadiness },
        { label: "Supply Chain", value: e.traceabilityReadiness },
        { label: "Compliance", value: Math.min(100, e.verifiedCertCount * 20) },
        { label: "Digital Passport", value: e.profileCompleteness },
        { label: "Blockchain Ready", value: 0 },
      ],
    };
  }
  const overall = Math.round((nhriScore + e.matchmakingReadiness + e.kpiReadiness) / 3);
  const bars = [
    { label: "Matchmaking", value: e.matchmakingReadiness },
    { label: "Supply Chain", value: e.traceabilityReadiness },
    { label: "Compliance", value: Math.min(100, e.verifiedCertCount * 20 + 40) },
    { label: "Digital Passport", value: Math.max(30, e.profileCompleteness - 10) },
    { label: "Blockchain Ready", value: Math.max(10, Math.round(e.confidenceScore / 4)) },
  ];
  return { overall, bars };
}

export interface TimelineEvent {
  when: "Today" | "Yesterday" | "This week";
  time: string;
  title: string;
  kind: "upload" | "review" | "score" | "message" | "edit" | "match" | "project";
}

export function buildTimeline(e: Entity): TimelineEvent[] {
  if (!isSeededOrg(e)) return [];
  return [
    { when: "Today", time: "1h ago", title: `Project milestone completed on ${e.name.split(" ")[0]} pilot`, kind: "project" },
    { when: "Today", time: "3h ago", title: `Research paper published in ecosystem`, kind: "upload" },
    { when: "Yesterday", time: "17:24", title: `${e.certifications[0] || "GOTS"} certificate uploaded`, kind: "upload" },
    { when: "Yesterday", time: "10:02", title: "Partner request accepted", kind: "match" },
    { when: "This week", time: "Mon", title: `Confidence score updated to ${e.confidenceScore}%`, kind: "score" },
    { when: "This week", time: "Mon", title: "Profile reviewed by GCH admin", kind: "review" },
  ];
}

export interface OpportunityItem {
  kind: "grant" | "partner" | "research";
  title: string;
  detail: string;
  value?: string;
  fit?: number;
}

export function buildOpportunities(e: Entity): OpportunityItem[] {
  if (!isSeededOrg(e)) return [];
  const matches = getMatchSuggestions(e);
  const top = matches[0];
  return [
    {
      kind: "grant",
      title: "EU Textile Grant qualification",
      detail: "Estimated funding envelope for verified organizations.",
      value: "€300,000",
    },
    top && {
      kind: "partner",
      title: `Potential partner · ${top.entity.name}`,
      detail: top.reasons[0] || "Strong tier and geography complementarity.",
      fit: top.score,
    },
    {
      kind: "research",
      title: "Suggested research institute · Fraunhofer",
      detail: "Circular textiles pilot — matches your material mix.",
    },
  ].filter(Boolean) as OpportunityItem[];
}
