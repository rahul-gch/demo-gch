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
  requester?: { name: string } | null;
  recipient?: { name: string } | null;
};

function label(status: string, proposedFor: string): MeetingStatus {
  const past = new Date(proposedFor).getTime() < Date.now();
  if (status === "declined" || status === "cancelled") return "Declined";
  if (status === "confirmed") return past ? "Past" : "Confirmed";
  return past ? "Past" : "Pending";
}

export function toMeetingRequest(row: Row, viewerOrgId: string): MeetingRequest {
  const iAmRequester = row.requester_org_id === viewerOrgId;
  const counterId = iAmRequester ? row.recipient_org_id : row.requester_org_id;
  const counterName = (iAmRequester ? row.recipient?.name : row.requester?.name) ?? "Organization";
  return {
    id: row.id,
    orgId: counterId,
    orgName: counterName,
    proposedFor: row.proposed_for,
    durationMin: row.duration_min,
    agenda: row.agenda,
    status: label(row.status, row.proposed_for),
    createdAt: row.created_at,
    viewerOrgId: row.requester_org_id,
  };
}
