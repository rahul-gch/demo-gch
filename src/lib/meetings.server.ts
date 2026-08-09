import type { MeetingRequest, MeetingStatus } from "@/lib/comms-types";

export const DB_STATUSES = ["pending", "confirmed", "declined", "cancelled"] as const;

type Row = {
  id: string;
  requester_org_id: string;
  recipient_org_id: string;
  proposed_for: string;
  duration_min: number;
  agenda: string;
  status: string;
  created_at: string;
  requester?: { name: string } | { name: string }[] | null;
  recipient?: { name: string } | { name: string }[] | null;
};

function label(status: string, proposedFor: string): MeetingStatus {
  const past = new Date(proposedFor).getTime() < Date.now();
  if (status === "cancelled") return "Withdrawn";
  if (status === "declined") return "Declined";
  if (status === "confirmed") return past ? "Past" : "Confirmed";
  return past ? "Past" : "Pending";
}

function name(v: Row["requester"]): string {
  const o = Array.isArray(v) ? v[0] : v;
  return o?.name ?? "Organization";
}

export function toMeetingRequest(row: Row, viewerOrgId: string): MeetingRequest {
  const iAmRequester = row.requester_org_id === viewerOrgId;
  const requesterName = name(row.requester);
  const recipientName = name(row.recipient);
  return {
    id: row.id,
    orgId: iAmRequester ? row.recipient_org_id : row.requester_org_id,
    orgName: iAmRequester ? recipientName : requesterName,
    proposedFor: row.proposed_for,
    durationMin: row.duration_min,
    agenda: row.agenda,
    status: label(row.status, row.proposed_for),
    createdAt: row.created_at,
    viewerOrgId: row.requester_org_id,
    requesterOrgId: row.requester_org_id,
    recipientOrgId: row.recipient_org_id,
    requesterName,
    recipientName,
    direction: iAmRequester ? "Sent" : "Received",
    rawStatus: row.status,
  };
}
