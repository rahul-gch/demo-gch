// Server-only helpers for the Projects workspace: row -> DTO mapping and
// org-id resolution (UI works with entity ids, the DB works with uuids).
import type {
  ActivityEvent,
  DiscussionThread,
  PartnerCategory,
  PermissionKey,
  Project,
  ProjectDoc,
  ProjectMeeting,
  ProjectPartner,
  ProjectRequest,
} from "@/lib/projects-types";
import { assertOrgRole } from "@/lib/rbac.server";

type Row = Record<string, unknown>;
type AnyClient = {
  from: (t: string) => any;
};

export interface OrgRef {
  uuid: string;
  entityId: string;
  name: string;
  country: string;
  entityType: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: string) => UUID_RE.test(v);

const CATEGORY: Record<string, PartnerCategory> = {
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

export async function loadOrgIndex(supabase: AnyClient) {
  const { data } = await supabase
    .from("orgs")
    .select("id, legacy_id, slug, name, country, entity_type, type");
  const byUuid = new Map<string, OrgRef>();
  const byEntityId = new Map<string, OrgRef>();
  for (const r of (data ?? []) as Row[]) {
    const uuid = String(r.id);
    const legacy = typeof r.legacy_id === "string" ? r.legacy_id : "";
    const slug = typeof r.slug === "string" ? r.slug : "";
    const name = String(r.name ?? "");
    const ref: OrgRef = {
      uuid,
      entityId: legacy || slug || uuid,
      name,
      country: String(r.country ?? ""),
      entityType: String(r.entity_type ?? r.type ?? "Brand"),
    };
    byUuid.set(uuid, ref);
    if (legacy) {
      byEntityId.set(legacy, ref);
      byEntityId.set(legacy.toLowerCase(), ref);
    }
    if (slug) {
      byEntityId.set(slug, ref);
      byEntityId.set(slug.toLowerCase(), ref);
    }
    if (name) {
      byEntityId.set(name.toLowerCase(), ref);
    }
    byEntityId.set(uuid, ref);
    byEntityId.set(uuid.toLowerCase(), ref);
  }
  return {
    byUuid,
    byEntityId,
    /** Accepts either an entity id ("gch-012"), a slug ("xyz"), or an org uuid. */
    toUuid(ref: string | null | undefined): string | null {
      if (!ref) return null;
      if (byEntityId.has(ref)) return byEntityId.get(ref)!.uuid;
      if (byEntityId.has(ref.toLowerCase())) return byEntityId.get(ref.toLowerCase())!.uuid;
      if (isUuid(ref) && byUuid.has(ref)) return ref;
      return isUuid(ref) ? ref : null;
    },
    toEntityId(uuid: string | null | undefined): string {
      if (!uuid) return "";
      return byUuid.get(uuid)?.entityId ?? uuid;
    },
    name(uuid: string | null | undefined): string {
      if (!uuid) return "";
      return byUuid.get(uuid)?.name ?? "";
    },
  };
}

export async function resolveOrgRow(supabase: AnyClient, ref: string) {
  if (!ref) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  if (isUuid) {
    const { data } = await supabase
      .from("orgs")
      .select("id, name, country, created_by, slug")
      .eq("id", ref)
      .maybeSingle();
    return data as { id: string; name: string; country: string | null; created_by?: string | null; slug?: string } | null;
  }
  const clean = ref.trim().toLowerCase();
  const { data } = await supabase
    .from("orgs")
    .select("id, name, country, created_by, slug")
    .or(`slug.ilike.${clean},legacy_id.ilike.${clean},name.ilike.${clean}`)
    .maybeSingle();
  return data as { id: string; name: string; country: string | null; created_by?: string | null; slug?: string } | null;
}

export type OrgIndex = Awaited<ReturnType<typeof loadOrgIndex>>;

const iso = (v: unknown) => (typeof v === "string" ? v : new Date().toISOString());
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const obj = (v: unknown): Record<string, number> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, number>) : {};

export function mapPartner(r: Row, idx: OrgIndex): ProjectPartner {
  const ref = idx.byUuid.get(String(r.org_id));
  const perms = (r.permissions ?? {}) as Record<string, boolean>;
  return {
    orgId: idx.toEntityId(String(r.org_id)),
    name: ref?.name ?? "Organization",
    orgType: CATEGORY[ref?.entityType ?? ""] ?? "Supplier",
    country: ref?.country ?? "",
    role: String(r.role ?? "Partner"),
    status: (r.status as ProjectPartner["status"]) ?? "Active",
    permissions: {
      view: perms.view ?? true,
      upload: !!perms.upload,
      edit: !!perms.edit,
      approve: !!perms.approve,
      invite: !!perms.invite,
      createRequests: !!perms.createRequests,
      comment: perms.comment ?? true,
      download: perms.download ?? true,
    } as Record<PermissionKey, boolean>,
  };
}

export function mapRequest(r: Row, idx: OrgIndex): ProjectRequest {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    assignedOrgId: idx.toEntityId(r.assigned_org_id as string | null),
    requestedByOrgId: idx.toEntityId(r.requested_by_org_id as string | null),
    priority: (r.priority as ProjectRequest["priority"]) ?? "Medium",
    dueDate: iso(r.due_date),
    status: (r.status as ProjectRequest["status"]) ?? "Open",
    attachments: arr(r.attachments),
    comments: arr<ProjectRequest["comments"][number]>(r.comments),
    createdAt: iso(r.created_at),
  };
}

export function mapDocument(r: Row, idx: OrgIndex): ProjectDoc {
  return {
    id: String(r.id),
    folder: (r.folder as ProjectDoc["folder"]) ?? "Reports",
    name: String(r.name ?? ""),
    uploadedByOrgId: idx.toEntityId(r.uploaded_by_org_id as string | null),
    uploadedAt: iso(r.created_at),
    version: Number(r.version ?? 1),
    visibility: (r.visibility as ProjectDoc["visibility"]) ?? "All Partners",
    url: (r.url as string | null) ?? undefined,
    mime: (r.mime as string | null) ?? undefined,
    sizeBytes: (r.size_bytes as number | null) ?? undefined,
    comments: arr(r.comments),
  };
}

export function mapDiscussion(r: Row, idx: OrgIndex): DiscussionThread {
  return {
    id: String(r.id),
    authorOrgId: idx.toEntityId(r.author_org_id as string | null),
    authorName: String(r.author_name ?? ""),
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    mentions: arr<string>(r.mentions),
    at: iso(r.created_at),
    reactions: obj(r.reactions),
    attachments: arr(r.attachments),
    replies: arr<DiscussionThread["replies"][number]>(r.replies),
  };
}

export function mapMeeting(r: Row, idx: OrgIndex): ProjectMeeting {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    date: String(r.meeting_date ?? "").slice(0, 10),
    time: String(r.meeting_time ?? "10:00"),
    participants: arr<string>(r.participants).map((p) => idx.toEntityId(p)),
    link: (r.link as string | null) ?? undefined,
    agenda: String(r.agenda ?? ""),
    notes: String(r.notes ?? ""),
    attachments: arr(r.attachments),
    actionItems: arr<ProjectMeeting["actionItems"][number]>(r.action_items).map((a) => ({
      ...a,
      ownerOrgId: a.ownerOrgId ? idx.toEntityId(a.ownerOrgId) : undefined,
    })),
  };
}

export function mapActivity(r: Row, idx: OrgIndex): ActivityEvent {
  return {
    id: String(r.id),
    type: (r.type as ActivityEvent["type"]) ?? "comment-added",
    actorOrgId: idx.toEntityId(r.actor_org_id as string | null),
    message: String(r.message ?? ""),
    at: iso(r.created_at),
  };
}

export function mapProject(
  r: Row,
  idx: OrgIndex,
  children: {
    partners: Row[];
    requests: Row[];
    documents: Row[];
    discussions: Row[];
    meetings: Row[];
    activity: Row[];
  },
): Project {
  return {
    id: String(r.id),
    ownerOrgId: idx.toEntityId(r.owner_org_id as string),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    objectives: arr<string>(r.objectives),
    status: (r.status as Project["status"]) ?? "Planning",
    startDate: iso(r.start_date),
    endDate: iso(r.end_date),
    progress: Number(r.progress ?? 0),
    image: String(r.image ?? ""),
    tags: arr<string>(r.tags),
    industry: String(r.industry ?? ""),
    country: String(r.country ?? ""),
    partners: children.partners.map((p) => mapPartner(p, idx)),
    requests: children.requests.map((p) => mapRequest(p, idx)),
    documents: children.documents.map((p) => mapDocument(p, idx)),
    discussions: children.discussions.map((p) => mapDiscussion(p, idx)),
    meetings: children.meetings.map((p) => mapMeeting(p, idx)),
    activity: children.activity.map((p) => mapActivity(p, idx)),
    updatedAt: iso(r.updated_at),
  };
}

export function groupBy<T extends Row>(rows: T[], key: string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = String(r[key]);
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}

/**
 * Asserts that the actor is authorized to perform mutations on a project:
 * 1. Actor user is a member of the actor organization with minRole.
 * 2. Actor organization is either the owner of the project or an active partner.
 */
export async function assertProjectAccess(
  supabase: any,
  userId: string,
  projectId: string,
  actorOrgId: string,
  minRole: "viewer" | "editor" | "admin" = "editor",
) {
  const actorUuid = (await resolveOrgRow(supabase, actorOrgId))?.id ?? actorOrgId;
  await assertOrgRole(supabase, userId, actorUuid, minRole);

  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_org_id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) throw new Error("Project not found");

  if (project.owner_org_id === actorUuid) {
    return { project, actorUuid, isOwner: true, partner: null };
  }

  const { data: partner } = await supabase
    .from("project_partners")
    .select("id, status, permissions")
    .eq("project_id", projectId)
    .eq("org_id", actorUuid)
    .maybeSingle();

  if (!partner) {
    throw new Error("Forbidden: your organization is not part of this project.");
  }

  return { project, actorUuid, isOwner: false, partner };
}

