// Shared types for the Partner Collaboration Workspace (Projects).
// Data lives in the backend; these are the DTO shapes returned by
// src/lib/projects.functions.ts.

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type RequestStatus =
  "Open" | "In Progress" | "Waiting for Response" | "Completed" | "Rejected";
export type RequestPriority = "Low" | "Medium" | "High" | "Urgent";
export type PartnerCategory =
  | "Brand"
  | "Manufacturer"
  | "Supplier"
  | "Research Institute"
  | "NGO"
  | "Auditor"
  | "Certifier"
  | "Recycler"
  | "Technology Provider"
  | "Investor"
  | "Consultant"
  | "Logistics"
  | "Government";

export type PermissionKey =
  "view" | "upload" | "edit" | "approve" | "invite" | "createRequests" | "comment" | "download";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view: "View Project",
  upload: "Upload Documents",
  edit: "Edit Shared Info",
  approve: "Approve Requests",
  invite: "Invite Members",
  createRequests: "Create Requests",
  comment: "Comment",
  download: "Download Files",
};

export interface ProjectPartner {
  orgId: string;
  name: string;
  orgType: PartnerCategory;
  country: string;
  role: string;
  status: "Invited" | "Active" | "Left";
  permissions: Record<PermissionKey, boolean>;
}

export type DocFolder =
  | "Certificates"
  | "Contracts"
  | "Design Files"
  | "Audit Reports"
  | "Images"
  | "Videos"
  | "Invoices"
  | "Reports";

export interface ProjectDoc {
  id: string;
  folder: DocFolder;
  name: string;
  uploadedByOrgId: string;
  uploadedAt: string;
  version: number;
  visibility: "All Partners" | "Owner Only";
  url?: string;
  mime?: string;
  sizeBytes?: number;
  comments: { id: string; author: string; body: string; at: string }[];
}

export interface RequestComment {
  id: string;
  authorOrgId: string;
  authorName: string;
  body: string;
  at: string;
}

export interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  assignedOrgId: string;
  requestedByOrgId: string;
  priority: RequestPriority;
  dueDate: string;
  status: RequestStatus;
  attachments: { name: string; url?: string }[];
  comments: RequestComment[];
  createdAt: string;
}

export interface DiscussionReply {
  id: string;
  authorOrgId: string;
  authorName: string;
  body: string;
  at: string;
  reactions: Record<string, number>;
}

export interface DiscussionThread {
  id: string;
  authorOrgId: string;
  authorName: string;
  title: string;
  body: string;
  mentions: string[];
  at: string;
  reactions: Record<string, number>;
  attachments: { name: string; url?: string }[];
  replies: DiscussionReply[];
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
  ownerOrgId?: string;
}

export interface ProjectMeeting {
  id: string;
  title: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:MM
  participants: string[]; // orgIds
  link?: string;
  agenda: string;
  notes: string;
  attachments: { name: string; url?: string }[];
  actionItems: ActionItem[];
}

export interface ActivityEvent {
  id: string;
  type:
    | "partner-joined"
    | "partner-invited"
    | "partner-removed"
    | "request-created"
    | "request-completed"
    | "document-uploaded"
    | "meeting-scheduled"
    | "comment-added"
    | "permission-changed"
    | "document-approved";
  actorOrgId: string;
  message: string;
  at: string;
}

export interface Project {
  id: string;
  ownerOrgId: string;
  name: string;
  description: string;
  objectives: string[];
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number; // 0..100
  image: string;
  tags: string[];
  industry: string;
  country: string;
  partners: ProjectPartner[];
  requests: ProjectRequest[];
  documents: ProjectDoc[];
  discussions: DiscussionThread[];
  meetings: ProjectMeeting[];
  activity: ActivityEvent[];
  updatedAt: string;
}

/** A request row plus the project it belongs to — used by the org requests inbox. */
export interface InboxRequest extends ProjectRequest {
  projectId: string;
  projectName: string;
  direction: "inbound" | "outbound";
}
