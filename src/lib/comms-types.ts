// Shared client-safe types for the messaging + meetings module.

export interface ThreadMessage {
  id: string;
  from: "me" | "them";
  authorName: string;
  authorRole: string;
  body: string;
  at: string; // ISO
  read?: boolean;
}

export type MeetingStatus = "Pending" | "Confirmed" | "Declined" | "Past";

export interface MeetingRequest {
  id: string;
  /** Counterpart organization (database UUID) as seen from the viewer. */
  orgId: string;
  orgName: string;
  proposedFor: string;
  durationMin: number;
  agenda: string;
  status: MeetingStatus;
  createdAt: string;
  /** UUID of the org that initiated the request. */
  viewerOrgId?: string;
}

export interface ConversationSummary {
  id: string;
  counterpartOrgId: string;
  lastMessageAt: string;
  unread: number;
  lastBody: string | null;
  lastFromMe: boolean;
}

export interface RawMessage {
  id: string;
  conversation_id: string;
  sender_org_id: string;
  author_name: string;
  author_role: string | null;
  body: string;
  created_at: string;
}
