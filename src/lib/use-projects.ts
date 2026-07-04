import { useEffect, useState } from "react";
import type { Entity } from "@/seed/types";
import {
  seedProjectsForOrg,
  type Project,
  type ProjectPartner,
  type ProjectRequest,
  type ProjectDoc,
  type DiscussionThread,
  type ProjectMeeting,
  type ActivityEvent,
  type PermissionKey,
  type RequestStatus,
} from "@/seed/projects";

const KEY = "gch.projects.v1";
type Store = Record<string, Project[]>;

const isBrowser = () => typeof window !== "undefined";
let cache: Store | null = null;

function load(): Store {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function getStore(): Store {
  if (cache) return cache;
  cache = load();
  return cache;
}

function persist() {
  if (!isBrowser() || !cache) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function ensure(entity: Entity): Project[] {
  const store = getStore();
  if (!store[entity.id]) {
    store[entity.id] = seedProjectsForOrg(entity);
    persist();
  }
  return store[entity.id];
}

function replace(entity: Entity, next: Project[]) {
  const store = getStore();
  store[entity.id] = next;
  persist();
  notify();
}

function updateProject(entity: Entity, projectId: string, fn: (p: Project) => Project) {
  const list = ensure(entity);
  replace(
    entity,
    list.map((p) => (p.id === projectId ? { ...fn(p), updatedAt: new Date().toISOString() } : p)),
  );
}

function pushActivity(project: Project, ev: Omit<ActivityEvent, "id" | "at">): Project {
  const entry: ActivityEvent = {
    ...ev,
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
  };
  return { ...project, activity: [entry, ...project.activity] };
}

// ---------- read hooks ----------

export function useProjects(entity: Entity): Project[] {
  const [list, setList] = useState<Project[]>(() => ensure(entity));
  useEffect(() => {
    setList(ensure(entity));
    const fn = () => setList([...ensure(entity)]);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [entity]);
  return list;
}

export function useProject(entity: Entity, projectId: string): Project | undefined {
  return useProjects(entity).find((p) => p.id === projectId);
}

// ---------- mutations ----------

export function createProject(entity: Entity, input: Partial<Project> & { name: string }) {
  const list = ensure(entity);
  const now = new Date().toISOString();
  const project: Project = {
    id: `${entity.id}-p-${Date.now()}`,
    ownerOrgId: entity.id,
    name: input.name,
    description: input.description ?? "",
    objectives: input.objectives ?? [],
    status: input.status ?? "Planning",
    startDate: input.startDate ?? now,
    endDate: input.endDate ?? new Date(Date.now() + 90 * 86400000).toISOString(),
    progress: input.progress ?? 0,
    image:
      input.image ??
      "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=70",
    tags: input.tags ?? [],
    industry: input.industry ?? "Sustainability",
    country: input.country ?? entity.country,
    partners: [
      {
        orgId: entity.id,
        name: entity.name,
        orgType: "Brand",
        country: entity.country,
        role: "Project Owner",
        status: "Active",
        permissions: {
          view: true,
          upload: true,
          edit: true,
          approve: true,
          invite: true,
          createRequests: true,
          comment: true,
          download: true,
        },
      },
    ],
    requests: [],
    documents: [],
    discussions: [],
    meetings: [],
    activity: [
      {
        id: `a-${Date.now()}`,
        type: "partner-joined",
        actorOrgId: entity.id,
        message: `${entity.name} created the project`,
        at: now,
      },
    ],
    updatedAt: now,
  };
  replace(entity, [project, ...list]);
  return project;
}

export function invitePartner(entity: Entity, projectId: string, partner: ProjectPartner) {
  updateProject(entity, projectId, (p) =>
    pushActivity(
      { ...p, partners: [...p.partners, partner] },
      {
        type: "partner-invited",
        actorOrgId: entity.id,
        message: `Invited ${partner.name} as ${partner.role}`,
      },
    ),
  );
}

export function setPartnerPermission(
  entity: Entity,
  projectId: string,
  orgId: string,
  key: PermissionKey,
  value: boolean,
) {
  updateProject(entity, projectId, (p) =>
    pushActivity(
      {
        ...p,
        partners: p.partners.map((pt) =>
          pt.orgId === orgId ? { ...pt, permissions: { ...pt.permissions, [key]: value } } : pt,
        ),
      },
      {
        type: "permission-changed",
        actorOrgId: entity.id,
        message: `Updated permission "${key}" for ${
          p.partners.find((pt) => pt.orgId === orgId)?.name ?? orgId
        }`,
      },
    ),
  );
}

export function createRequest(
  entity: Entity,
  projectId: string,
  req: Omit<ProjectRequest, "id" | "createdAt" | "comments" | "attachments" | "status"> &
    Partial<Pick<ProjectRequest, "attachments" | "status">>,
) {
  const full: ProjectRequest = {
    ...req,
    id: `req-${Date.now()}`,
    createdAt: new Date().toISOString(),
    comments: [],
    attachments: req.attachments ?? [],
    status: req.status ?? "Open",
  };
  updateProject(entity, projectId, (p) =>
    pushActivity(
      { ...p, requests: [full, ...p.requests] },
      {
        type: "request-created",
        actorOrgId: entity.id,
        message: `New request: ${full.title}`,
      },
    ),
  );
}

export function setRequestStatus(
  entity: Entity,
  projectId: string,
  requestId: string,
  status: RequestStatus,
) {
  updateProject(entity, projectId, (p) => {
    const next = {
      ...p,
      requests: p.requests.map((r) => (r.id === requestId ? { ...r, status } : r)),
    };
    if (status === "Completed") {
      const r = p.requests.find((x) => x.id === requestId);
      return pushActivity(next, {
        type: "request-completed",
        actorOrgId: entity.id,
        message: `Request completed: ${r?.title ?? requestId}`,
      });
    }
    return next;
  });
}

export function addRequestComment(
  entity: Entity,
  projectId: string,
  requestId: string,
  body: string,
) {
  updateProject(entity, projectId, (p) =>
    pushActivity(
      {
        ...p,
        requests: p.requests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                comments: [
                  ...r.comments,
                  {
                    id: `rc-${Date.now()}`,
                    authorOrgId: entity.id,
                    authorName: entity.name,
                    body,
                    at: new Date().toISOString(),
                  },
                ],
              }
            : r,
        ),
      },
      {
        type: "comment-added",
        actorOrgId: entity.id,
        message: `Commented on a request`,
      },
    ),
  );
}

export function uploadDocument(entity: Entity, projectId: string, doc: Omit<ProjectDoc, "id" | "uploadedAt" | "version" | "comments"> & Partial<Pick<ProjectDoc, "version">>) {
  updateProject(entity, projectId, (p) => {
    const existing = p.documents.find((d) => d.name === doc.name && d.folder === doc.folder);
    const full: ProjectDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      version: (existing?.version ?? 0) + 1,
      comments: [],
    };
    return pushActivity(
      { ...p, documents: [full, ...p.documents.filter((d) => d.id !== existing?.id)] },
      {
        type: "document-uploaded",
        actorOrgId: entity.id,
        message: `Uploaded ${full.name} to ${full.folder}`,
      },
    );
  });
}

export function addDiscussion(
  entity: Entity,
  projectId: string,
  thread: Omit<DiscussionThread, "id" | "at" | "reactions" | "replies" | "attachments" | "mentions"> &
    Partial<Pick<DiscussionThread, "attachments" | "mentions">>,
) {
  const full: DiscussionThread = {
    ...thread,
    id: `d-${Date.now()}`,
    at: new Date().toISOString(),
    reactions: {},
    replies: [],
    attachments: thread.attachments ?? [],
    mentions: thread.mentions ?? [],
  };
  updateProject(entity, projectId, (p) => ({ ...p, discussions: [full, ...p.discussions] }));
}

export function replyDiscussion(
  entity: Entity,
  projectId: string,
  threadId: string,
  body: string,
) {
  updateProject(entity, projectId, (p) => ({
    ...p,
    discussions: p.discussions.map((d) =>
      d.id === threadId
        ? {
            ...d,
            replies: [
              ...d.replies,
              {
                id: `dr-${Date.now()}`,
                authorOrgId: entity.id,
                authorName: entity.name,
                body,
                at: new Date().toISOString(),
                reactions: {},
              },
            ],
          }
        : d,
    ),
  }));
}

export function reactDiscussion(
  entity: Entity,
  projectId: string,
  threadId: string,
  emoji: string,
) {
  updateProject(entity, projectId, (p) => ({
    ...p,
    discussions: p.discussions.map((d) =>
      d.id === threadId
        ? { ...d, reactions: { ...d.reactions, [emoji]: (d.reactions[emoji] ?? 0) + 1 } }
        : d,
    ),
  }));
}

export function scheduleMeeting(
  entity: Entity,
  projectId: string,
  meeting: Omit<ProjectMeeting, "id" | "notes" | "attachments" | "actionItems"> &
    Partial<Pick<ProjectMeeting, "notes" | "attachments" | "actionItems">>,
) {
  const full: ProjectMeeting = {
    ...meeting,
    id: `m-${Date.now()}`,
    notes: meeting.notes ?? "",
    attachments: meeting.attachments ?? [],
    actionItems: meeting.actionItems ?? [],
  };
  updateProject(entity, projectId, (p) =>
    pushActivity(
      { ...p, meetings: [full, ...p.meetings] },
      {
        type: "meeting-scheduled",
        actorOrgId: entity.id,
        message: `Scheduled meeting: ${full.title}`,
      },
    ),
  );
}

export function toggleActionItem(
  entity: Entity,
  projectId: string,
  meetingId: string,
  itemId: string,
) {
  updateProject(entity, projectId, (p) => ({
    ...p,
    meetings: p.meetings.map((m) =>
      m.id === meetingId
        ? {
            ...m,
            actionItems: m.actionItems.map((a) =>
              a.id === itemId ? { ...a, done: !a.done } : a,
            ),
          }
        : m,
    ),
  }));
}
