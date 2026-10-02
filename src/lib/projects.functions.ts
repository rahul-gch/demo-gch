import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { InboxRequest, Project } from "@/lib/projects-types";
import {
  assertProjectAccess,
  groupBy,
  loadOrgIndex,
  mapProject,
  mapRequest,
  resolveOrgRow,
} from "@/lib/projects.server";
import { assertOrgRole, getOrgUserRole } from "@/lib/rbac.server";

const orgInput = z.object({ orgId: z.string().min(1) });
const idInput = z.object({ projectId: z.string().uuid() });

export const getMyOrgRoleFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => orgInput.parse(d))
  .handler(async ({ data, context }) => {
    return getOrgUserRole(context.supabase, context.userId, data.orgId);
  });

const OWNER_PERMS = {
  view: true,
  upload: true,
  edit: true,
  approve: true,
  invite: true,
  createRequests: true,
  comment: true,
  download: true,
};

export const listProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => orgInput.parse(d))
  .handler(async ({ data, context }): Promise<Project[]> => {
    const { supabase } = context;
    const org = await resolveOrgRow(supabase, data.orgId);
    const targetOrgId = org?.id ?? data.orgId;

    const [{ data: owned }, { data: partnerOf }] = await Promise.all([
      supabase.from("projects").select("id").eq("owner_org_id", targetOrgId),
      supabase.from("project_partners").select("project_id").eq("org_id", targetOrgId),
    ]);
    const ids = Array.from(
      new Set([
        ...((owned ?? []) as { id: string }[]).map((r: any) => r.id),
        ...((partnerOf ?? []) as { project_id: string }[]).map((r: any) => r.project_id),
      ]),
    );
    if (ids.length === 0) return [];

    const [
      { data: projects },
      { data: partners },
      { data: requests },
      { data: documents },
      { data: discussions },
      { data: meetings },
      { data: activity },
      idx,
    ] = await Promise.all([
      supabase.from("projects").select("*").in("id", ids).order("updated_at", { ascending: false }),
      supabase.from("project_partners").select("*").in("project_id", ids).order("created_at"),
      supabase
        .from("project_requests")
        .select("*")
        .in("project_id", ids)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_documents")
        .select("*")
        .in("project_id", ids)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_discussions")
        .select("*")
        .in("project_id", ids)
        .order("created_at", { ascending: false }),
      supabase.from("project_meetings").select("*").in("project_id", ids).order("meeting_date"),
      supabase
        .from("project_activity")
        .select("*")
        .in("project_id", ids)
        .order("created_at", { ascending: false }),
      loadOrgIndex(supabase),
    ]);

    const gp = groupBy((partners ?? []) as never[], "project_id");
    const gr = groupBy((requests ?? []) as never[], "project_id");
    const gd = groupBy((documents ?? []) as never[], "project_id");
    const gdis = groupBy((discussions ?? []) as never[], "project_id");
    const gm = groupBy((meetings ?? []) as never[], "project_id");
    const ga = groupBy((activity ?? []) as never[], "project_id");

    return ((projects ?? []) as Record<string, unknown>[]).map((p) =>
      mapProject(p, idx, {
        partners: gp.get(String(p.id)) ?? [],
        requests: gr.get(String(p.id)) ?? [],
        documents: gd.get(String(p.id)) ?? [],
        discussions: gdis.get(String(p.id)) ?? [],
        meetings: gm.get(String(p.id)) ?? [],
        activity: ga.get(String(p.id)) ?? [],
      }),
    );
  });

export const listOrgRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => orgInput.parse(d))
  .handler(async ({ data, context }): Promise<InboxRequest[]> => {
    const { supabase } = context;
    const org = await resolveOrgRow(supabase, data.orgId);
    if (!org?.id) return [];
    const targetOrgId = org.id;

    const { data: rows, error } = await supabase
      .from("project_requests")
      .select("*")
      .or(`assigned_org_id.eq.${targetOrgId},requested_by_org_id.eq.${targetOrgId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const projectIds = Array.from(
      new Set(((rows ?? []) as { project_id: string }[]).map((r) => r.project_id)),
    );
    const [{ data: projects }, idx] = await Promise.all([
      projectIds.length
        ? supabase.from("projects").select("id, name").in("id", projectIds)
        : Promise.resolve({ data: [] }),
      loadOrgIndex(supabase),
    ]);
    const projectName = new Map(
      ((projects ?? []) as { id: string; name: string }[]).map((p: any) => [p.id, p.name]),
    );

    return ((rows ?? []) as Record<string, unknown>[]).map((r) => {
      const base = mapRequest(r, idx);
      const isAssignedToMe = r.assigned_org_id === targetOrgId;
      return {
        ...base,
        projectId: String(r.project_id),
        projectName: projectName.get(String(r.project_id)) ?? "Project",
        direction: isAssignedToMe ? "inbound" : "outbound",
      } satisfies InboxRequest;
    });
  });

export const createProjectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().min(1),
        name: z.string().trim().min(1).max(160),
        description: z.string().trim().max(2000).default(""),
        tags: z.array(z.string().trim().max(40)).max(20).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const org = await resolveOrgRow(supabase, data.orgId);
    const targetOrgId = org?.id ?? data.orgId;

    // Assert minimum role: Editor
    await assertOrgRole(supabase, userId, targetOrgId, "editor");

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_org_id: targetOrgId,
        created_by: userId,
        name: data.name,
        description: data.description,
        tags: data.tags,
        status: "Planning",
        progress: 0,
        industry: "Sustainability",
        country: org?.country ?? "Germany",
        image: "",
      } as never)
      .select("id")
      .single();
    if (error) {
      if (error.code === "42501" || /row-level security/i.test(error.message)) {
        throw new Error(
          "You need at least Editor access in this organization to create a project.",
        );
      }
      throw new Error(error.message);
    }

    await supabase.from("project_partners").insert({
      project_id: project.id,
      org_id: targetOrgId,
      role: "Project Owner",
      status: "Active",
      permissions: OWNER_PERMS,
    } as never);

    await supabase.from("project_activity").insert({
      project_id: project.id,
      type: "partner-joined",
      actor_org_id: targetOrgId,
      actor_user_id: userId,
      message: `${org?.name ?? "Organization"} created the project`,
    } as never);

    return { id: project.id as string };
  });

export const invitePartnerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        partnerRef: z.string().min(1),
        role: z.string().trim().max(80).default("Partner"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "admin");
    const actorUuid = access.actorUuid;
    if (!access.isOwner) {
      const perms = (access.partner?.permissions ?? {}) as Record<string, boolean>;
      if (!perms.invite) {
        throw new Error("You need the invite permission on this project to invite partners.");
      }
    }

    const idx = await loadOrgIndex(supabase);
    const partnerUuid = idx.toUuid(data.partnerRef);
    if (!partnerUuid) throw new Error("Unknown organization");

    const { error } = await supabase.from("project_partners").insert({
      project_id: data.projectId,
      org_id: partnerUuid,
      role: data.role,
      status: "Invited",
      permissions: {
        view: true,
        upload: false,
        edit: false,
        approve: false,
        invite: false,
        createRequests: false,
        comment: true,
        download: true,
      },
    } as never);
    if (error) throw new Error(error.message);

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "partner-invited",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: `Invited ${idx.name(partnerUuid)} as ${data.role}`,
    } as never);
    return { ok: true };
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ projectId: z.string().uuid(), actorOrgId: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: project } = await supabase
      .from("projects")
      .select("id, owner_org_id, name")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!project) throw new Error("Project not found");

    // Only owners/admins of the organization that owns the project may delete it.
    await assertOrgRole(supabase, userId, project.owner_org_id as string, "admin");

    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      if (error.code === "42501" || /row-level security/i.test(error.message)) {
        throw new Error("Only owners and admins of the owning organization can delete this project.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const removePartnerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        partnerRef: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "admin");
    const actorUuid = access.actorUuid;
    const project = access.project;

    const idx = await loadOrgIndex(supabase);
    const partnerUuid = idx.toUuid(data.partnerRef);
    if (!partnerUuid) throw new Error("Unknown organization");

    if ((project.owner_org_id as string) === partnerUuid) {
      throw new Error("The organization that owns the project cannot be removed.");
    }

    // Owner-org managers may remove anyone; other partners need the "invite" permission.
    const ownerRole = await getOrgUserRole(supabase, userId, project.owner_org_id as string);
    const isOwnerManager = ownerRole.isMember && (ownerRole.isOwner || ownerRole.isAdmin);
    if (!isOwnerManager) {
      await assertOrgRole(supabase, userId, actorUuid, "admin");
      const { data: me } = await supabase
        .from("project_partners")
        .select("permissions")
        .eq("project_id", data.projectId)
        .eq("org_id", actorUuid)
        .maybeSingle();
      const perms = (me?.permissions ?? {}) as Record<string, boolean>;
      if (!perms.invite) {
        throw new Error("You need the invite permission on this project to remove partners.");
      }
    }

    const { error, count } = await supabase
      .from("project_partners")
      .delete({ count: "exact" })
      .eq("project_id", data.projectId)
      .eq("org_id", partnerUuid);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Partner not found on this project");

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "partner-removed",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: `${idx.name(actorUuid)} removed ${idx.name(partnerUuid)} from the project`,
    } as never);
    return { ok: true };
  });

export const setPartnerPermissionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        partnerRef: z.string().min(1),
        key: z.string().min(1).max(30),
        value: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "admin");
    const actorUuid = access.actorUuid;

    const idx = await loadOrgIndex(supabase);
    const partnerUuid = idx.toUuid(data.partnerRef);
    if (!partnerUuid) throw new Error("Unknown organization");

    const { data: row } = await supabase
      .from("project_partners")
      .select("id, permissions")
      .eq("project_id", data.projectId)
      .eq("org_id", partnerUuid)
      .maybeSingle();
    if (!row) throw new Error("Partner not found on this project");

    const next = {
      ...((row.permissions ?? {}) as Record<string, boolean>),
      [data.key]: data.value,
    };
    const { error } = await supabase
      .from("project_partners")
      .update({ permissions: next } as never)
      .eq("id", row.id);
    if (error) throw new Error(error.message);

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "permission-changed",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: `Updated permission "${data.key}" for ${idx.name(partnerUuid)}`,
    } as never);
    return { ok: true };
  });

export const createRequestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(4000).default(""),
        assignedRef: z.string().min(1),
        priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
        dueDate: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { error } = await supabase.from("project_requests").insert({
      project_id: data.projectId,
      title: data.title,
      description: data.description,
      assigned_org_id: idx.toUuid(data.assignedRef),
      requested_by_org_id: actorUuid,
      requested_by: userId,
      priority: data.priority,
      due_date: data.dueDate ?? null,
      status: "Open",
    } as never);
    if (error) throw new Error(error.message);

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "request-created",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: `New request: ${data.title}`,
    } as never);
    return { ok: true };
  });

export const setRequestStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        requestId: z.string().uuid(),
        status: z.enum(["Open", "In Progress", "Waiting for Response", "Completed", "Rejected"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { data: row, error } = await supabase
      .from("project_requests")
      .update({ status: data.status } as never)
      .eq("id", data.requestId)
      .select("title")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (data.status === "Completed") {
      await supabase.from("project_activity").insert({
        project_id: data.projectId,
        type: "request-completed",
        actor_org_id: actorUuid,
        actor_user_id: userId,
        message: `Request completed: ${row?.title ?? ""}`,
      } as never);
    }
    return { ok: true };
  });

export const addRequestCommentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        requestId: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { data: row } = await supabase
      .from("project_requests")
      .select("comments")
      .eq("id", data.requestId)
      .maybeSingle();
    const { data: member } = await supabase
      .from("org_members")
      .select("display_name")
      .eq("org_id", actorUuid)
      .eq("user_id", userId)
      .maybeSingle();

    const comments = [
      ...((row?.comments ?? []) as unknown[]),
      {
        id: `rc-${Date.now()}`,
        authorOrgId: idx.toEntityId(actorUuid),
        authorName: member?.display_name ?? idx.name(actorUuid),
        body: data.body,
        at: new Date().toISOString(),
      },
    ];
    const { error } = await supabase
      .from("project_requests")
      .update({ comments } as never)
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "comment-added",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: "Commented on a request",
    } as never);
    return { ok: true };
  });

export const uploadDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        folder: z.string().min(1).max(40),
        name: z.string().trim().min(1).max(200),
        visibility: z.enum(["All Partners", "Owner Only"]).default("All Partners"),
        mime: z.string().max(120).optional(),
        sizeBytes: z.number().int().nonnegative().optional(),
        url: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { data: existing } = await supabase
      .from("project_documents")
      .select("id, version")
      .eq("project_id", data.projectId)
      .eq("folder", data.folder)
      .eq("name", data.name)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("project_documents").insert({
      project_id: data.projectId,
      folder: data.folder,
      name: data.name,
      uploaded_by_org_id: actorUuid,
      uploaded_by: userId,
      version: (existing?.version ?? 0) + 1,
      visibility: data.visibility,
      mime: data.mime ?? null,
      size_bytes: data.sizeBytes ?? null,
      url: data.url ?? null,
    } as never);
    if (error) throw new Error(error.message);

    if (existing?.id) {
      await supabase.from("project_documents").delete().eq("id", existing.id);
    }

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "document-uploaded",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: `Uploaded ${data.name} to ${data.folder}`,
    } as never);
    return { ok: true };
  });

export const addDiscussionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        title: z.string().trim().max(200).default(""),
        body: z.string().trim().min(1).max(8000),
        mentions: z.array(z.string().max(80)).max(20).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { data: member } = await supabase
      .from("org_members")
      .select("display_name")
      .eq("org_id", actorUuid)
      .eq("user_id", userId)
      .maybeSingle();

    const { error } = await supabase.from("project_discussions").insert({
      project_id: data.projectId,
      author_org_id: actorUuid,
      author_user_id: userId,
      author_name: member?.display_name ?? idx.name(actorUuid),
      title: data.title,
      body: data.body,
      mentions: data.mentions,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const replyDiscussionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        actorOrgId: z.string().min(1),
        threadId: z.string().uuid(),
        body: z.string().trim().min(1).max(8000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("project_discussions")
      .select("replies, project_id")
      .eq("id", data.threadId)
      .maybeSingle();
    if (!row) throw new Error("Discussion thread not found");

    const access = await assertProjectAccess(supabase, userId, row.project_id as string, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { data: member } = await supabase
      .from("org_members")
      .select("display_name")
      .eq("org_id", actorUuid)
      .eq("user_id", userId)
      .maybeSingle();

    const replies = [
      ...((row?.replies ?? []) as unknown[]),
      {
        id: `dr-${Date.now()}`,
        authorOrgId: idx.toEntityId(actorUuid),
        authorName: member?.display_name ?? idx.name(actorUuid),
        body: data.body,
        at: new Date().toISOString(),
        reactions: {},
      },
    ];
    const { error } = await supabase
      .from("project_discussions")
      .update({ replies } as never)
      .eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reactDiscussionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ threadId: z.string().uuid(), emoji: z.string().min(1).max(8) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("project_discussions")
      .select("reactions, project_id")
      .eq("id", data.threadId)
      .maybeSingle();
    if (!row) throw new Error("Discussion thread not found");

    const { data: isMember } = await supabase.rpc("is_project_member", {
      _user: userId,
      _project: row.project_id,
    });
    if (!isMember) {
      const { data: isAdmin } = await supabase.rpc("is_platform_admin", { _user: userId });
      if (!isAdmin) throw new Error("Forbidden: you are not a member of this project.");
    }
    const reactions = { ...((row?.reactions ?? {}) as Record<string, number>) };
    reactions[data.emoji] = (reactions[data.emoji] ?? 0) + 1;
    const { error } = await supabase
      .from("project_discussions")
      .update({ reactions } as never)
      .eq("id", data.threadId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const scheduleMeetingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        actorOrgId: z.string().min(1),
        title: z.string().trim().min(1).max(200),
        date: z.string().min(4).max(30),
        time: z.string().min(3).max(10).default("10:00"),
        link: z.string().max(500).optional(),
        agenda: z.string().max(4000).default(""),
        participants: z.array(z.string().min(1)).max(60).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const access = await assertProjectAccess(supabase, userId, data.projectId, data.actorOrgId, "editor");
    const idx = await loadOrgIndex(supabase);
    const actorUuid = access.actorUuid;

    const { error } = await supabase.from("project_meetings").insert({
      project_id: data.projectId,
      title: data.title,
      meeting_date: data.date.slice(0, 10),
      meeting_time: data.time,
      link: data.link ?? null,
      agenda: data.agenda,
      participants: data.participants.map((p) => idx.toUuid(p)).filter((v: any): v is string => !!v),
      created_by: userId,
    } as never);
    if (error) throw new Error(error.message);

    await supabase.from("project_activity").insert({
      project_id: data.projectId,
      type: "meeting-scheduled",
      actor_org_id: actorUuid,
      actor_user_id: userId,
      message: `Scheduled meeting: ${data.title}`,
    } as never);
    return { ok: true };
  });

export const toggleActionItemFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ meetingId: z.string().uuid(), itemId: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("project_meetings")
      .select("action_items, project_id")
      .eq("id", data.meetingId)
      .maybeSingle();
    if (!row) throw new Error("Meeting not found");

    const { data: isMember } = await supabase.rpc("is_project_member", {
      _user: userId,
      _project: row.project_id,
    });
    if (!isMember) {
      const { data: isAdmin } = await supabase.rpc("is_platform_admin", { _user: userId });
      if (!isAdmin) throw new Error("Forbidden: you are not a member of this project.");
    }
    const items = ((row?.action_items ?? []) as { id: string; done: boolean }[]).map((a) =>
      a.id === data.itemId ? { ...a, done: !a.done } : a,
    );
    const { error } = await supabase
      .from("project_meetings")
      .update({ action_items: items } as never)
      .eq("id", data.meetingId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// keep zod input helper referenced for type inference consumers
export type ProjectIdInput = z.infer<typeof idInput>;
