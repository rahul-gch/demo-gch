import { useEffect } from "react";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Entity } from "@/seed/types";
import type {
  DiscussionThread,
  InboxRequest,
  PermissionKey,
  Project,
  ProjectDoc,
  ProjectMeeting,
  ProjectPartner,
  ProjectRequest,
  RequestStatus,
} from "@/lib/projects-types";
import {
  addDiscussionFn,
  addRequestCommentFn,
  createProjectFn,
  createRequestFn,
  invitePartnerFn,
  listOrgRequests,
  listProjects,
  reactDiscussionFn,
  replyDiscussionFn,
  scheduleMeetingFn,
  setPartnerPermissionFn,
  setRequestStatusFn,
  toggleActionItemFn,
  uploadDocumentFn,
} from "@/lib/projects.functions";

const orgUuid = (entity: Entity) => entity.orgUuid ?? entity.id;

export const projectsKey = (orgId: string) => ["projects", orgId] as const;
export const orgRequestsKey = (orgId: string) => ["project-requests", orgId] as const;

// The mutation helpers below are plain functions (called straight from event
// handlers), so they need a QueryClient reference to invalidate reads.
let qc: QueryClient | null = null;

function invalidate(entity: Entity) {
  const id = orgUuid(entity);
  qc?.invalidateQueries({ queryKey: projectsKey(id) });
  qc?.invalidateQueries({ queryKey: orgRequestsKey(id) });
  // partner orgs see the same project through their own key
  qc?.invalidateQueries({ queryKey: ["projects"] });
}

async function run(entity: Entity, fn: () => Promise<unknown>) {
  try {
    await fn();
    invalidate(entity);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Something went wrong");
  }
}

// ---------- read hooks ----------

export function useProjects(entity: Entity): Project[] {
  const client = useQueryClient();
  useEffect(() => {
    qc = client;
  }, [client]);

  const id = orgUuid(entity);
  const { data } = useQuery({
    queryKey: projectsKey(id),
    queryFn: () => listProjects({ data: { orgId: id } }),
    staleTime: 15_000,
  });
  return data ?? [];
}

export function useProject(entity: Entity, projectId: string): Project | undefined {
  return useProjects(entity).find((p) => p.id === projectId);
}

export function useOrgRequests(entity: Entity): InboxRequest[] {
  const id = orgUuid(entity);
  const { data } = useQuery({
    queryKey: orgRequestsKey(id),
    queryFn: () => listOrgRequests({ data: { orgId: id } }),
    staleTime: 15_000,
  });
  return data ?? [];
}

// ---------- mutations ----------

export function createProject(
  entity: Entity,
  input: { name: string; description?: string; tags?: string[] },
) {
  void run(entity, () =>
    createProjectFn({
      data: {
        orgId: orgUuid(entity),
        name: input.name,
        description: input.description ?? "",
        tags: input.tags ?? [],
      },
    }),
  );
}

export function invitePartner(entity: Entity, projectId: string, partner: ProjectPartner) {
  void run(entity, () =>
    invitePartnerFn({
      data: {
        projectId,
        actorOrgId: orgUuid(entity),
        partnerRef: partner.orgId,
        role: partner.role || "Partner",
      },
    }),
  );
}

export function setPartnerPermission(
  entity: Entity,
  projectId: string,
  orgId: string,
  key: PermissionKey,
  value: boolean,
) {
  void run(entity, () =>
    setPartnerPermissionFn({
      data: { projectId, actorOrgId: orgUuid(entity), partnerRef: orgId, key, value },
    }),
  );
}

export function createRequest(
  entity: Entity,
  projectId: string,
  req: Omit<ProjectRequest, "id" | "createdAt" | "comments" | "attachments" | "status"> &
    Partial<Pick<ProjectRequest, "attachments" | "status">>,
) {
  void run(entity, () =>
    createRequestFn({
      data: {
        projectId,
        actorOrgId: orgUuid(entity),
        title: req.title,
        description: req.description ?? "",
        assignedRef: req.assignedOrgId,
        priority: req.priority,
        dueDate: req.dueDate || undefined,
      },
    }),
  );
}

export function setRequestStatus(
  entity: Entity,
  projectId: string,
  requestId: string,
  status: RequestStatus,
) {
  void run(entity, () =>
    setRequestStatusFn({
      data: { projectId, actorOrgId: orgUuid(entity), requestId, status },
    }),
  );
}

export function addRequestComment(
  entity: Entity,
  projectId: string,
  requestId: string,
  body: string,
) {
  void run(entity, () =>
    addRequestCommentFn({
      data: { projectId, actorOrgId: orgUuid(entity), requestId, body },
    }),
  );
}

export function uploadDocument(
  entity: Entity,
  projectId: string,
  doc: Omit<ProjectDoc, "id" | "uploadedAt" | "version" | "comments"> &
    Partial<Pick<ProjectDoc, "version">>,
) {
  void run(entity, () =>
    uploadDocumentFn({
      data: {
        projectId,
        actorOrgId: orgUuid(entity),
        folder: doc.folder,
        name: doc.name,
        visibility: doc.visibility,
        mime: doc.mime,
        sizeBytes: doc.sizeBytes,
        url: doc.url,
      },
    }),
  );
}

export function addDiscussion(
  entity: Entity,
  projectId: string,
  thread: Omit<
    DiscussionThread,
    "id" | "at" | "reactions" | "replies" | "attachments" | "mentions"
  > &
    Partial<Pick<DiscussionThread, "attachments" | "mentions">>,
) {
  void run(entity, () =>
    addDiscussionFn({
      data: {
        projectId,
        actorOrgId: orgUuid(entity),
        title: thread.title ?? "",
        body: thread.body,
        mentions: thread.mentions ?? [],
      },
    }),
  );
}

export function replyDiscussion(
  entity: Entity,
  _projectId: string,
  threadId: string,
  body: string,
) {
  void run(entity, () =>
    replyDiscussionFn({ data: { actorOrgId: orgUuid(entity), threadId, body } }),
  );
}

export function reactDiscussion(
  entity: Entity,
  _projectId: string,
  threadId: string,
  emoji: string,
) {
  void run(entity, () => reactDiscussionFn({ data: { threadId, emoji } }));
}

export function scheduleMeeting(
  entity: Entity,
  projectId: string,
  meeting: Omit<ProjectMeeting, "id" | "notes" | "attachments" | "actionItems"> &
    Partial<Pick<ProjectMeeting, "notes" | "attachments" | "actionItems">>,
) {
  void run(entity, () =>
    scheduleMeetingFn({
      data: {
        projectId,
        actorOrgId: orgUuid(entity),
        title: meeting.title,
        date: meeting.date,
        time: meeting.time || "10:00",
        link: meeting.link || undefined,
        agenda: meeting.agenda ?? "",
        participants: meeting.participants ?? [],
      },
    }),
  );
}

export function toggleActionItem(
  entity: Entity,
  _projectId: string,
  meetingId: string,
  itemId: string,
) {
  void run(entity, () => toggleActionItemFn({ data: { meetingId, itemId } }));
}
