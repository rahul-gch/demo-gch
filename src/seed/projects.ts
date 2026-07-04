// Local seed store for the Partner Collaboration Workspace (Projects).
// All state lives client-side via useProjects; this file only provides
// deterministic seed data per org.
import type { Entity } from "./types";
import { ALL_ENTITIES } from "./all-entities";

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type RequestStatus =
  | "Open"
  | "In Progress"
  | "Waiting for Response"
  | "Completed"
  | "Rejected";
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
  | "view"
  | "upload"
  | "edit"
  | "approve"
  | "invite"
  | "createRequests"
  | "comment"
  | "download";

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
  mentions: string[]; // org names
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
  date: string; // ISO date
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

// ---------- deterministic seed ----------

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const IMAGES = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1200&q=70",
  "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=70",
];

function categoryFor(e: Entity): PartnerCategory {
  const map: Record<string, PartnerCategory> = {
    Brand: "Brand",
    Farmer: "Supplier",
    Ginner: "Supplier",
    Spinner: "Manufacturer",
    "Fabric Mill": "Manufacturer",
    "Dye House": "Manufacturer",
    "Garment Factory": "Manufacturer",
    "Logistics Provider": "Logistics",
    "Certification Body": "Certifier",
    "Sustainability Partner": "NGO",
  };
  return map[e.entityType] ?? "Supplier";
}

function fullPerms(all: boolean): Record<PermissionKey, boolean> {
  return {
    view: true,
    upload: all,
    edit: all,
    approve: all,
    invite: all,
    createRequests: all,
    comment: true,
    download: true,
  };
}

function partnerFrom(e: Entity, role: string, status: ProjectPartner["status"] = "Active", owner = false): ProjectPartner {
  return {
    orgId: e.id,
    name: e.name,
    orgType: categoryFor(e),
    country: e.country,
    role,
    status,
    permissions: fullPerms(owner),
  };
}

function pickPartners(owner: Entity, seed: number): ProjectPartner[] {
  const pool = ALL_ENTITIES.filter((e) => e.id !== owner.id);
  const roles = [
    "Tier-1 Manufacturer",
    "Tier-2 Supplier",
    "Certifier",
    "Auditor",
    "Research Partner",
    "Logistics",
  ];
  const picks: ProjectPartner[] = [partnerFrom(owner, "Project Owner", "Active", true)];
  for (let i = 0; i < 5; i++) {
    const idx = (seed + i * 7) % pool.length;
    picks.push(partnerFrom(pool[idx], roles[i % roles.length], i === 4 ? "Invited" : "Active"));
  }
  return picks;
}

function seedProject(owner: Entity, index: number): Project {
  const seed = hash(`${owner.id}-p-${index}`);
  const now = Date.now();
  const partners = pickPartners(owner, seed);
  const templates = [
    {
      name: `${owner.name} — Regenerative Cotton Program`,
      description:
        "Multi-partner regenerative cotton sourcing pilot covering farm-to-fabric traceability, soil health monitoring, and living-income premiums.",
      objectives: [
        "Onboard 2,000 farmers by end of pilot",
        "Achieve 100% bale-level traceability",
        "Publish verified LCA by Q4",
      ],
      industry: "Textiles & Apparel",
      tags: ["Regenerative", "Traceability", "Living Income"],
      status: "Active" as ProjectStatus,
      progress: 42,
    },
    {
      name: `${owner.name} — DPP Readiness Consortium`,
      description:
        "Cross-tier Digital Product Passport readiness working group aligning suppliers, auditors and tech vendors for EU ESPR compliance.",
      objectives: [
        "Map data requirements across Tier 0–3",
        "Deliver a shared DPP data schema",
        "Pilot 3 SKUs end-to-end",
      ],
      industry: "Compliance & Traceability",
      tags: ["DPP", "ESPR", "Interoperability"],
      status: "Planning" as ProjectStatus,
      progress: 18,
    },
    {
      name: `${owner.name} — Closed-Loop Water Initiative`,
      description:
        "Joint capex program to retrofit dye houses with ZLD systems and shared monitoring across the mill cluster.",
      objectives: [
        "Retrofit 6 dye houses",
        "Cut freshwater draw by 60%",
        "Publish public monitoring dashboard",
      ],
      industry: "Manufacturing",
      tags: ["Water", "ZLD", "Capex"],
      status: "Active" as ProjectStatus,
      progress: 67,
    },
  ];
  const t = templates[index % templates.length];
  const activePartners = partners.filter((p) => p.status === "Active");
  const p1 = activePartners[1] ?? partners[0];
  const p2 = activePartners[2] ?? partners[0];

  const requests: ProjectRequest[] = [
    {
      id: `req-${seed}-1`,
      title: "Submit updated GOTS certificate",
      description: "Please share your renewed GOTS scope certificate for FY26 audit records.",
      assignedOrgId: p1.orgId,
      requestedByOrgId: owner.id,
      priority: "High",
      dueDate: new Date(now + 7 * 86400000).toISOString(),
      status: "Open",
      attachments: [],
      comments: [],
      createdAt: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: `req-${seed}-2`,
      title: "Approve packaging design v3",
      description: "Recyclable mono-material packaging spec attached — need brand sign-off.",
      assignedOrgId: owner.id,
      requestedByOrgId: p2.orgId,
      priority: "Medium",
      dueDate: new Date(now + 14 * 86400000).toISOString(),
      status: "In Progress",
      attachments: [{ name: "packaging-v3.pdf" }],
      comments: [
        {
          id: "rc-1",
          authorOrgId: owner.id,
          authorName: "Brand Ops",
          body: "Reviewing with sustainability team, feedback by Friday.",
          at: new Date(now - 86400000).toISOString(),
        },
      ],
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: `req-${seed}-3`,
      title: "Complete Q3 social audit",
      description: "SLCP self/joint assessment due before shipment approval.",
      assignedOrgId: p1.orgId,
      requestedByOrgId: owner.id,
      priority: "Urgent",
      dueDate: new Date(now + 3 * 86400000).toISOString(),
      status: "Waiting for Response",
      attachments: [],
      comments: [],
      createdAt: new Date(now - 5 * 86400000).toISOString(),
    },
    {
      id: `req-${seed}-4`,
      title: "Provide fabric sample lot 22-A",
      description: "Need 3 x 1m swatches shipped to design studio for handfeel testing.",
      assignedOrgId: p2.orgId,
      requestedByOrgId: owner.id,
      priority: "Low",
      dueDate: new Date(now - 5 * 86400000).toISOString(),
      status: "Completed",
      attachments: [],
      comments: [],
      createdAt: new Date(now - 20 * 86400000).toISOString(),
    },
  ];

  const documents: ProjectDoc[] = [
    {
      id: `doc-${seed}-1`,
      folder: "Certificates",
      name: "GOTS-Scope-Certificate-FY25.pdf",
      uploadedByOrgId: p1.orgId,
      uploadedAt: new Date(now - 4 * 86400000).toISOString(),
      version: 2,
      visibility: "All Partners",
      mime: "application/pdf",
      sizeBytes: 512_000,
      comments: [],
    },
    {
      id: `doc-${seed}-2`,
      folder: "Contracts",
      name: "Framework-Agreement-v1.docx",
      uploadedByOrgId: owner.id,
      uploadedAt: new Date(now - 12 * 86400000).toISOString(),
      version: 1,
      visibility: "All Partners",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 220_000,
      comments: [],
    },
    {
      id: `doc-${seed}-3`,
      folder: "Audit Reports",
      name: "SLCP-2025-Q2.pdf",
      uploadedByOrgId: p2.orgId,
      uploadedAt: new Date(now - 30 * 86400000).toISOString(),
      version: 1,
      visibility: "All Partners",
      mime: "application/pdf",
      sizeBytes: 980_000,
      comments: [],
    },
    {
      id: `doc-${seed}-4`,
      folder: "Images",
      name: "site-walkthrough.jpg",
      uploadedByOrgId: p1.orgId,
      uploadedAt: new Date(now - 2 * 86400000).toISOString(),
      version: 1,
      visibility: "All Partners",
      mime: "image/jpeg",
      url: "https://images.unsplash.com/photo-1581091012184-7c6b7e9b9e3f?auto=format&fit=crop&w=1200&q=70",
      comments: [],
    },
  ];

  const discussions: DiscussionThread[] = [
    {
      id: `d-${seed}-1`,
      authorOrgId: owner.id,
      authorName: "Program Lead",
      title: "Kickoff notes and shared workplan",
      body: "Sharing the agreed workplan and RACI. @Manufacturer please confirm data-collection cadence.",
      mentions: ["Manufacturer"],
      at: new Date(now - 6 * 86400000).toISOString(),
      reactions: { "👍": 4, "🎉": 2 },
      attachments: [{ name: "workplan-v1.pdf" }],
      replies: [
        {
          id: `dr-${seed}-1`,
          authorOrgId: p1.orgId,
          authorName: p1.name,
          body: "Confirmed — biweekly cadence works for us.",
          at: new Date(now - 5 * 86400000).toISOString(),
          reactions: { "👍": 2 },
        },
      ],
    },
    {
      id: `d-${seed}-2`,
      authorOrgId: p2.orgId,
      authorName: p2.name,
      title: "Question on scope 3 boundary",
      body: "Are inbound logistics from ginners in-scope for this pilot?",
      mentions: ["Auditor"],
      at: new Date(now - 2 * 86400000).toISOString(),
      reactions: { "🙏": 1 },
      attachments: [],
      replies: [],
    },
  ];

  const meetings: ProjectMeeting[] = [
    {
      id: `m-${seed}-1`,
      title: "Weekly steering committee",
      date: new Date(now + 2 * 86400000).toISOString().slice(0, 10),
      time: "14:00",
      participants: partners.map((p) => p.orgId),
      link: "https://meet.example.com/steering",
      agenda: "Progress review · blockers · data submissions · action items.",
      notes: "",
      attachments: [],
      actionItems: [
        { id: "ai-1", text: "Circulate updated KPI template", done: false, ownerOrgId: owner.id },
        { id: "ai-2", text: "Confirm audit window", done: true, ownerOrgId: p1.orgId },
      ],
    },
    {
      id: `m-${seed}-2`,
      title: "DPP data schema workshop",
      date: new Date(now + 9 * 86400000).toISOString().slice(0, 10),
      time: "10:30",
      participants: [owner.id, p1.orgId, p2.orgId],
      link: "https://meet.example.com/dpp",
      agenda: "Align on attribute list, resolve identifier mapping, walk through pilot SKUs.",
      notes: "",
      attachments: [],
      actionItems: [],
    },
  ];

  const activity: ActivityEvent[] = [
    {
      id: `a-${seed}-1`,
      type: "partner-joined",
      actorOrgId: p1.orgId,
      message: `${p1.name} accepted the invitation`,
      at: new Date(now - 10 * 86400000).toISOString(),
    },
    {
      id: `a-${seed}-2`,
      type: "document-uploaded",
      actorOrgId: p1.orgId,
      message: `${p1.name} uploaded GOTS-Scope-Certificate-FY25.pdf`,
      at: new Date(now - 4 * 86400000).toISOString(),
    },
    {
      id: `a-${seed}-3`,
      type: "request-created",
      actorOrgId: owner.id,
      message: "New request: Submit updated GOTS certificate",
      at: new Date(now - 2 * 86400000).toISOString(),
    },
    {
      id: `a-${seed}-4`,
      type: "meeting-scheduled",
      actorOrgId: owner.id,
      message: "Scheduled weekly steering committee",
      at: new Date(now - 86400000).toISOString(),
    },
    {
      id: `a-${seed}-5`,
      type: "request-completed",
      actorOrgId: p2.orgId,
      message: `${p2.name} completed “Provide fabric sample lot 22-A”`,
      at: new Date(now - 5 * 86400000).toISOString(),
    },
  ];

  return {
    id: `${owner.id}-project-${index}`,
    ownerOrgId: owner.id,
    name: t.name,
    description: t.description,
    objectives: t.objectives,
    status: t.status,
    startDate: new Date(now - 60 * 86400000).toISOString(),
    endDate: new Date(now + 180 * 86400000).toISOString(),
    progress: t.progress,
    image: IMAGES[index % IMAGES.length],
    tags: t.tags,
    industry: t.industry,
    country: owner.country,
    partners,
    requests,
    documents,
    discussions,
    meetings,
    activity,
    updatedAt: new Date(now - 86400000).toISOString(),
  };
}

export function seedProjectsForOrg(entity: Entity): Project[] {
  return [0, 1, 2].map((i) => seedProject(entity, i));
}
