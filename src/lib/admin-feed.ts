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

export const KIND_META: Record<FeedEventKind, { label: string }> = {
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
