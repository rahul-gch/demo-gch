import { ALL_ENTITIES } from "@/seed/all-entities";
import type { Entity } from "@/seed/types";

export type FeedEventKind =
  | "upload"
  | "verification"
  | "approval"
  | "ai"
  | "project"
  | "message"
  | "partnership"
  | "certification"
  | "risk";

export type FeedSeverity = "critical" | "warning" | "info" | "success";

export interface AdminFeedEvent {
  id: string;
  at: string; // ISO
  kind: FeedEventKind;
  severity: FeedSeverity;
  orgId: string;
  orgName: string;
  entityType: Entity["entityType"];
  country: string;
  title: string;
  detail: string;
}

const TEMPLATES: {
  kind: FeedEventKind;
  severity: FeedSeverity;
  title: (e: Entity) => string;
  detail: (e: Entity) => string;
}[] = [
  {
    kind: "upload",
    severity: "info",
    title: (e) => `${e.name} uploaded a new document`,
    detail: (e) => `${e.certifications[0] || "Sustainability report"} added to the passport.`,
  },
  {
    kind: "verification",
    severity: "success",
    title: (e) => `${e.name} passed verification`,
    detail: (e) => `Admin confirmed ${e.entityType} profile in ${e.country}.`,
  },
  {
    kind: "verification",
    severity: "warning",
    title: (e) => `${e.name} verification pending review`,
    detail: () => "Two documents flagged for manual check.",
  },
  {
    kind: "approval",
    severity: "info",
    title: (e) => `Partnership approved · ${e.name}`,
    detail: () => "Admin greenlit a new brand–supplier link.",
  },
  {
    kind: "ai",
    severity: "warning",
    title: (e) => `AI flagged missing ESG data on ${e.name}`,
    detail: () => "Scope 3 disclosures not reported for 2025.",
  },
  {
    kind: "ai",
    severity: "critical",
    title: (e) => `AI detected duplicate profile · ${e.name}`,
    detail: () => "Same tax ID appears on two organizations.",
  },
  {
    kind: "project",
    severity: "info",
    title: (e) => `${e.name} created a new project`,
    detail: () => "Circular cotton pilot · 6-month timeline.",
  },
  {
    kind: "project",
    severity: "warning",
    title: (e) => `${e.name} project delayed`,
    detail: () => "Milestone slipped past due date by 14 days.",
  },
  {
    kind: "message",
    severity: "info",
    title: (e) => `New broadcast from ${e.name}`,
    detail: () => "Message sent to 14 network partners.",
  },
  {
    kind: "partnership",
    severity: "success",
    title: (e) => `${e.name} accepted a partnership`,
    detail: () => "3-year offtake agreement signed.",
  },
  {
    kind: "certification",
    severity: "warning",
    title: (e) => `Certificate expires soon · ${e.name}`,
    detail: (e) =>
      `${e.certificationDetails[0]?.name || "GOTS"} due for renewal within 30 days.`,
  },
  {
    kind: "certification",
    severity: "critical",
    title: (e) => `Certificate expired · ${e.name}`,
    detail: () => "Bluesign lapsed. Auto-suspension in 7 days.",
  },
  {
    kind: "risk",
    severity: "critical",
    title: (e) => `Supply chain risk · ${e.name}`,
    detail: (e) => `Tier ${e.actorType.slice(-1)} exposure flagged in ${e.country}.`,
  },
  {
    kind: "upload",
    severity: "success",
    title: (e) => `${e.name} completed Higg FEM module`,
    detail: () => "Score improved by 8 points quarter-over-quarter.",
  },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

let cache: AdminFeedEvent[] | null = null;

export function getAdminFeedEvents(): AdminFeedEvent[] {
  if (cache) return cache;
  const base = Date.now();
  const events: AdminFeedEvent[] = [];
  ALL_ENTITIES.forEach((e, idx) => {
    // 3 events per org for a rich but bounded stream.
    for (let i = 0; i < 3; i++) {
      const seed = hash(`${e.id}-${i}`);
      const tpl = TEMPLATES[(seed + idx) % TEMPLATES.length];
      const minutesAgo = (seed % (60 * 24 * 6)) + i * 7; // last 6 days
      events.push({
        id: `${e.id}-ev-${i}`,
        at: new Date(base - minutesAgo * 60_000).toISOString(),
        kind: tpl.kind,
        severity: tpl.severity,
        orgId: e.id,
        orgName: e.name,
        entityType: e.entityType,
        country: e.country,
        title: tpl.title(e),
        detail: tpl.detail(e),
      });
    }
  });
  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  cache = events;
  return events;
}

export function formatRelative(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export const KIND_META: Record<
  FeedEventKind,
  { label: string }
> = {
  upload: { label: "Uploads" },
  verification: { label: "Verifications" },
  approval: { label: "Approvals" },
  ai: { label: "AI" },
  project: { label: "Projects" },
  message: { label: "Messages" },
  partnership: { label: "Partnerships" },
  certification: { label: "Certifications" },
  risk: { label: "Risk" },
};
