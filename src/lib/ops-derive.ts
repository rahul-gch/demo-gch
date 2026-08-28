import { ALL_ENTITIES, summaryMetrics } from "@/seed/all-entities";
import type { Entity } from "@/seed/types";

// Small deterministic PRNG based on a numeric seed derived from string.
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rand(seed: number): () => number {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

export type Severity = "critical" | "warning" | "info" | "success";

export interface PriorityItem {
  id: string;
  tone: Severity;
  label: string;
  count: number;
  to: string;
}

export function todaysPriorities(): PriorityItem[] {
  const waitingVerification = ALL_ENTITIES.filter((e) => e.verificationStatus === "Pending").length;
  const expiringToday = 2;
  const newMatches = 4;
  const delayedProjects = 1;
  return [
    {
      id: "verify",
      tone: "critical",
      label: "organizations waiting verification",
      count: waitingVerification,
      to: "/organizations",
    },
    {
      id: "certs",
      tone: "warning",
      label: "certificates expire today",
      count: expiringToday,
      to: "/organizations",
    },
    {
      id: "matches",
      tone: "info",
      label: "new matchmaking requests",
      count: newMatches,
      to: "/matchmaking",
    },
    {
      id: "delay",
      tone: "critical",
      label: "project delayed more than 14 days",
      count: delayedProjects,
      to: "/organizations",
    },
  ];
}

export interface PlatformCounts {
  organizations: number;
  countries: number;
  activeProjects: number;
  verificationRequests: number;
  healthPct: number;
}

export function platformCounts(healthPct: number): PlatformCounts {
  return {
    organizations: summaryMetrics.totalRegistry,
    countries: summaryMetrics.countries,
    activeProjects: 14,
    verificationRequests: summaryMetrics.pending + 3,
    healthPct,
  };
}

export interface AlertItem {
  id: string;
  tone: Severity;
  title: string;
  detail: string;
  to: string;
}

export function platformAlerts(): AlertItem[] {
  return [
    {
      id: "incomplete",
      tone: "warning",
      title: `${summaryMetrics.incomplete + 4} incomplete organization profiles`,
      detail: "Missing addresses, capabilities, or contacts.",
      to: "/organizations",
    },
    {
      id: "cert-exp",
      tone: "critical",
      title: "5 certificates expiring this week",
      detail: "GOTS, OEKO-TEX, and Bluesign renewals due.",
      to: "/organizations",
    },
    {
      id: "delayed",
      tone: "warning",
      title: "3 delayed projects",
      detail: "Two brand pilots and one supplier onboarding.",
      to: "/organizations",
    },
    {
      id: "approvals",
      tone: "info",
      title: "8 pending partner approvals",
      detail: "Awaiting admin review across 4 regions.",
      to: "/matchmaking",
    },
    {
      id: "dupes",
      tone: "info",
      title: "AI detected 2 duplicate suppliers",
      detail: "Same tax ID across different regions.",
      to: "/organizations",
    },
    {
      id: "esg",
      tone: "warning",
      title: "6 organizations missing ESG data",
      detail: "Scope 1 & 2 emissions not reported for 2025.",
      to: "/organizations",
    },
  ];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: "plus" | "userplus" | "building" | "handshake" | "message" | "megaphone";
  to: string;
  search?: Record<string, string>;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "add-org",
    label: "Add organization",
    icon: "plus",
    to: "/admin/organizations",
    search: { tab: "add" },
  },
  {
    id: "invite",
    label: "Onboarding links",
    icon: "userplus",
    to: "/admin/organizations",
    search: { tab: "invites" },
  },
  { id: "orgs", label: "Organizations", icon: "building", to: "/organizations" },
  { id: "match", label: "Matchmaking", icon: "handshake", to: "/matchmaking" },
  { id: "messages", label: "Messages", icon: "message", to: "/messages" },
  {
    id: "feed",
    label: "Community feed",
    icon: "megaphone",
    to: "/feed",
    search: { tab: "community" },
  },
];

export type ApprovalKind =
  "Verification" | "Projects" | "Partnerships" | "Org Updates" | "Invitations" | "Certificates";

export interface ApprovalRow {
  id: string;
  orgId: string;
  orgName: string;
  type: string;
  waitingHours: number;
  priority: "High" | "Medium" | "Low";
}

export function pendingApprovals(kind: ApprovalKind): ApprovalRow[] {
  const rng = rand(seedFrom(kind));
  const pool = ALL_ENTITIES;
  const rows: ApprovalRow[] = [];
  const size = 5 + Math.floor(rng() * 3);
  const typeByKind: Record<ApprovalKind, string[]> = {
    Verification: ["Profile verification", "Document review", "KYC recheck"],
    Projects: ["New project", "Milestone change", "Budget revision"],
    Partnerships: ["Partner request", "Extend agreement", "Terminate"],
    "Org Updates": ["Legal name change", "Address update", "Ownership update"],
    Invitations: ["Admin invite", "Auditor invite", "Team member"],
    Certificates: ["GOTS renewal", "OEKO-TEX", "Bluesign upload"],
  };
  const prios: ApprovalRow["priority"][] = ["High", "Medium", "Low"];
  for (let i = 0; i < size; i++) {
    const e = pool[Math.floor(rng() * pool.length)];
    const types = typeByKind[kind];
    rows.push({
      id: `${kind}-${i}-${e.id}`,
      orgId: e.id,
      orgName: e.name,
      type: types[Math.floor(rng() * types.length)],
      waitingHours: 1 + Math.floor(rng() * 96),
      priority: prios[Math.floor(rng() * prios.length)],
    });
  }
  return rows;
}

export type ActivityKind = "upload" | "approval" | "ai" | "project" | "verification";

export interface ActivityRow {
  time: string;
  kind: ActivityKind;
  org: string;
  text: string;
}

export function liveActivity(): ActivityRow[] {
  return [
    { time: "09:52", kind: "upload", org: "Nike", text: "uploaded Bluesign certificate" },
    {
      time: "09:40",
      kind: "approval",
      org: "PUMA",
      text: "accepted partnership with Arvind Mills",
    },
    {
      time: "09:18",
      kind: "project",
      org: "Adidas",
      text: "created project 'Circular Cotton Pilot'",
    },
    {
      time: "08:54",
      kind: "verification",
      org: "Sivakumar Textiles",
      text: "supplier verification completed",
    },
    { time: "08:31", kind: "ai", org: "H&M", text: "AI flagged missing ESG report for 2025" },
    { time: "08:12", kind: "upload", org: "Primark", text: "updated Higg FEM 4.0 module" },
    { time: "07:58", kind: "approval", org: "M&S", text: "approved supplier onboarding request" },
    { time: "07:31", kind: "ai", org: "Zalando", text: "AI matched 3 potential Tier 2 suppliers" },
  ];
}

export interface AiFinding {
  id: string;
  title: string;
  detail: string;
}

export function aiFindings(): AiFinding[] {
  return [
    {
      id: "dupes",
      title: "17 duplicate suppliers",
      detail: "Same tax IDs across different regions.",
    },
    {
      id: "certs",
      title: "12 missing certifications",
      detail: "Suppliers claim standards without evidence.",
    },
    {
      id: "opps",
      title: "8 partnership opportunities",
      detail: "High-fit matches waiting for introduction.",
    },
    {
      id: "esg",
      title: "4 suspicious ESG reports",
      detail: "Anomalies detected in Scope 3 disclosures.",
    },
    {
      id: "supply",
      title: "3 organizations with incomplete supply chain",
      detail: "Missing Tier 3 and Tier 4 traceability.",
    },
  ];
}

export interface KpiTrend {
  id: string;
  label: string;
  value: number;
  delta: string;
  sparkline: number[];
}

export function growthKpis(): KpiTrend[] {
  const spark = (seed: string) => {
    const r = rand(seedFrom(seed));
    return Array.from({ length: 14 }, () => 20 + Math.floor(r() * 80));
  };
  return [
    {
      id: "orgs",
      label: "Organizations",
      value: summaryMetrics.totalRegistry,
      delta: "+14 this month",
      sparkline: spark("orgs"),
    },
    { id: "projects", label: "Projects", value: 14, delta: "+8", sparkline: spark("projects") },
    { id: "messages", label: "Messages", value: 486, delta: "+26%", sparkline: spark("messages") },
    {
      id: "partnerships",
      label: "Partnerships",
      value: 92,
      delta: "+17%",
      sparkline: spark("partners"),
    },
    {
      id: "compliance",
      label: "Compliance",
      value: 78,
      delta: "+12%",
      sparkline: spark("compliance"),
    },
  ];
}

export interface CountryRow {
  country: string;
  count: number;
}

export function topCountries(limit = 8): CountryRow[] {
  const map = new Map<string, number>();
  for (const e of ALL_ENTITIES) map.set(e.country, (map.get(e.country) || 0) + 1);
  return Array.from(map, ([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface SystemStatusRow {
  service: string;
  status: "healthy" | "warning" | "down";
  detail: string;
}

export function systemStatus(): SystemStatusRow[] {
  return [
    { service: "API", status: "healthy", detail: "142ms avg" },
    { service: "Database", status: "healthy", detail: "read/write" },
    { service: "Storage", status: "warning", detail: "87% used" },
    { service: "Email Service", status: "healthy", detail: "queue 0" },
    { service: "Matching Engine", status: "healthy", detail: "running" },
    { service: "AI Models", status: "healthy", detail: "3 pipelines" },
  ];
}

export interface UserRow {
  role: string;
  count: number;
}

export function userOverview(): UserRow[] {
  const byType = (t: Entity["entityType"]) => ALL_ENTITIES.filter((e) => e.entityType === t).length;
  return [
    { role: "Admins", count: 4 },
    { role: "Moderators", count: 9 },
    { role: "Brands", count: byType("Brand") },
    {
      role: "Suppliers",
      count:
        byType("Garment Factory") + byType("Fabric Mill") + byType("Spinner") + byType("Dye House"),
    },
    { role: "Research Institutes", count: 6 },
    { role: "NGOs", count: 4 },
    { role: "Auditors", count: 3 },
    { role: "Certification Bodies", count: byType("Certification Body") },
  ];
}

export interface RequestRow {
  id: string;
  type: string;
  org: string;
  status: "New" | "In review" | "Waiting";
  ageHours: number;
}

export function recentRequests(): RequestRow[] {
  const rng = rand(seedFrom("requests"));
  const types = [
    "Organization Verification",
    "Research Access",
    "Meeting Request",
    "Project Creation",
    "Partner Invitation",
    "Certificate Upload",
  ];
  const statuses: RequestRow["status"][] = ["New", "In review", "Waiting"];
  return Array.from({ length: 6 }, (_, i) => {
    const e = ALL_ENTITIES[Math.floor(rng() * ALL_ENTITIES.length)];
    return {
      id: `req-${i}`,
      type: types[i],
      org: e.name,
      status: statuses[Math.floor(rng() * statuses.length)],
      ageHours: 1 + Math.floor(rng() * 48),
    };
  });
}

export interface ScheduledJob {
  time: string;
  name: string;
  status: "scheduled" | "done";
}

export function scheduledJobs(): ScheduledJob[] {
  return [
    { time: "23:00", name: "Supply Chain Refresh", status: "scheduled" },
    { time: "01:00", name: "AI ESG Scoring", status: "scheduled" },
    { time: "02:00", name: "Certificate Validation", status: "scheduled" },
    { time: "03:00", name: "Matching Engine Refresh", status: "scheduled" },
    { time: "04:00", name: "Backup", status: "scheduled" },
  ];
}

export interface FooterStatus {
  version: string;
  lastAiUpdate: string;
  lastDbSync: string;
  lastBackup: string;
  uptime: string;
}

export function footerStatus(): FooterStatus {
  return {
    version: "v1.4.2",
    lastAiUpdate: "12 min ago",
    lastDbSync: "3 min ago",
    lastBackup: "Today 04:00",
    uptime: "99.98%",
  };
}
