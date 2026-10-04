import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NotificationKind = "message" | "meeting" | "request" | "partner";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  /** Route the row navigates to. */
  to: string;
}

export interface SharedCounts {
  projects: number;
  documents: number;
  pendingRequests: number;
}

const orgInput = (d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d);

export const listNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(orgInput)
  .handler(async ({ data, context }): Promise<NotificationItem[]> => {
    const { supabase, userId } = context;
    const orgId = data.orgId;

    // Caller must belong to the organization or be a platform admin
    const [{ data: isMember }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("is_org_member", { _user: userId, _org: orgId }),
      supabase.rpc("is_platform_admin", { _user: userId }),
    ]);
    if (!isMember && !isAdmin) return [];

    const items: NotificationItem[] = [];

    // --- unread messages ---
    try {
      const { data: mine } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("org_id", orgId);

      const convIds = (mine ?? []).map((r) => r.conversation_id);
      if (convIds.length > 0) {
        const readAt = new Map((mine ?? []).map((r) => [r.conversation_id, r.last_read_at]));
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, conversation_id, sender_org_id, author_name, body, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false })
          .limit(200);

        const senderIds = Array.from(
          new Set((msgs ?? []).map((m) => m.sender_org_id).filter((id) => id !== orgId)),
        );
        const names = new Map<string, string>();
        if (senderIds.length > 0) {
          const { data: orgRows } = await supabase
            .from("orgs")
            .select("id, name")
            .in("id", senderIds);
          for (const o of orgRows ?? []) names.set(o.id, o.name);
        }

        const seen = new Set<string>();
        for (const m of msgs ?? []) {
          if (m.sender_org_id === orgId) continue;
          const since = readAt.get(m.conversation_id);
          if (since && m.created_at <= since) continue;
          if (seen.has(m.conversation_id)) continue;
          seen.add(m.conversation_id);
          items.push({
            id: `msg-${m.id}`,
            kind: "message",
            title: names.get(m.sender_org_id) ?? "Partner organization",
            body: m.body.length > 120 ? `${m.body.slice(0, 117)}…` : m.body,
            at: m.created_at,
            to: "/messages",
          });
        }
      }
    } catch {
      // ignore
    }

    // --- pending meeting requests received ---
    try {
      const { data: meetings } = await supabase
        .from("meeting_requests")
        .select(
          "id, proposed_for, agenda, created_at, requester:orgs!meeting_requests_requester_org_id_fkey(name)",
        )
        .eq("recipient_org_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);

      for (const m of (meetings ?? []) as Array<{
        id: string;
        proposed_for: string;
        agenda: string | null;
        created_at: string;
        requester: { name: string } | { name: string }[] | null;
      }>) {
        const requester = Array.isArray(m.requester) ? m.requester[0] : m.requester;
        items.push({
          id: `meet-${m.id}`,
          kind: "meeting",
          title: `Meeting request from ${requester?.name ?? "an organization"}`,
          body: m.agenda?.trim() ? m.agenda.slice(0, 120) : new Date(m.proposed_for).toLocaleString(),
          at: m.created_at,
          to: "/meetings",
        });
      }
    } catch {
      // ignore
    }

    // --- open project requests assigned to this org ---
    try {
      const { data: requests } = await supabase
        .from("project_requests")
        .select("id, title, status, created_at, project_id, projects(owner_org_id)")
        .eq("assigned_org_id", orgId)
        .in("status", ["open", "Open", "pending", "Pending"])
        .order("created_at", { ascending: false })
        .limit(20);

      for (const r of (requests ?? []) as Array<{
        id: string;
        title: string;
        created_at: string;
        project_id: string;
        projects: { owner_org_id: string } | { owner_org_id: string }[] | null;
      }>) {
        const project = Array.isArray(r.projects) ? r.projects[0] : r.projects;
        items.push({
          id: `req-${r.id}`,
          kind: "request",
          title: "Project request",
          body: r.title,
          at: r.created_at,
          to: project
            ? `/organizations/${project.owner_org_id}/projects/${r.project_id}/requests`
            : "/messages",
        });
      }
    } catch {
      // ignore
    }

    // --- pending inbound sample orders ---
    try {
      const { data: sampleOrders } = await supabase
        .from("sample_orders")
        .select(
          "id, quantity, material, created_at, buyer:orgs!sample_orders_buyer_org_id_fkey(name), product:showroom_products(name)",
        )
        .eq("seller_org_id", orgId)
        .eq("status", "requested")
        .order("created_at", { ascending: false })
        .limit(20);

      for (const s of (sampleOrders ?? []) as Array<{
        id: string;
        quantity: number;
        material: string | null;
        created_at: string;
        buyer: { name: string } | { name: string }[] | null;
        product: { name: string } | { name: string }[] | null;
      }>) {
        const buyer = Array.isArray(s.buyer) ? s.buyer[0] : s.buyer;
        const product = Array.isArray(s.product) ? s.product[0] : s.product;
        items.push({
          id: `sample-${s.id}`,
          kind: "request",
          title: `Sample request from ${buyer?.name ?? "an organization"}`,
          body: `${product?.name ?? "Product"} (${s.quantity} units)`,
          at: s.created_at,
          to: `/organizations/${orgId}/showroom`,
        });
      }
    } catch {
      // ignore
    }

    // --- pending project partner invitations ---
    try {
      const { data: partners } = await supabase
        .from("project_partners")
        .select("id, status, created_at, project_id, projects(name, owner_org_id)")
        .eq("org_id", orgId)
        .in("status", ["pending", "Pending", "invited", "Invited"])
        .order("created_at", { ascending: false })
        .limit(20);

      for (const p of (partners ?? []) as Array<{
        id: string;
        created_at: string;
        project_id: string;
        projects:
          { name: string; owner_org_id: string } | { name: string; owner_org_id: string }[] | null;
      }>) {
        const project = Array.isArray(p.projects) ? p.projects[0] : p.projects;
        items.push({
          id: `partner-${p.id}`,
          kind: "partner",
          title: "Project invitation",
          body: project?.name ?? "You were invited to a project",
          at: p.created_at,
          to: project
            ? `/organizations/${project.owner_org_id}/projects/${p.project_id}/partners`
            : "/messages",
        });
      }
    } catch {
      // ignore
    }

    return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 30);
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(orgInput)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify caller belongs to the organization
    const [{ data: isMember }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("is_org_member", { _user: userId, _org: data.orgId }),
      supabase.rpc("is_platform_admin", { _user: userId }),
    ]);
    if (!isMember && !isAdmin) {
      throw new Error("Forbidden: not a member of this organization.");
    }

    try {
      const { error } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("org_id", data.orgId);
      if (error) throw new Error(error.message);
    } catch {
      // ignore
    }
    return { ok: true };
  });

/** Real counts of what two organizations actually share. */
export const orgSharedCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ orgId: z.string().uuid(), counterpartOrgId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<SharedCounts> => {
    const { supabase, userId } = context;
    const { orgId, counterpartOrgId } = data;

    // Caller must belong to at least one of the two organizations, or be a platform admin
    const [{ data: isMemberA }, { data: isMemberB }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("is_org_member", { _user: userId, _org: orgId }),
      supabase.rpc("is_org_member", { _user: userId, _org: counterpartOrgId }),
      supabase.rpc("is_platform_admin", { _user: userId }),
    ]);
    if (!isMemberA && !isMemberB && !isAdmin) {
      return { projects: 0, documents: 0, pendingRequests: 0 };
    }

    try {
      const [{ data: ownedA }, { data: ownedB }, { data: partnerA }, { data: partnerB }] =
        await Promise.all([
          supabase.from("projects").select("id").eq("owner_org_id", orgId),
          supabase.from("projects").select("id").eq("owner_org_id", counterpartOrgId),
          supabase.from("project_partners").select("project_id").eq("org_id", orgId),
          supabase.from("project_partners").select("project_id").eq("org_id", counterpartOrgId),
        ]);

      const setA = new Set([
        ...(ownedA ?? []).map((r) => r.id),
        ...(partnerA ?? []).map((r) => r.project_id),
      ]);
      const setB = new Set([
        ...(ownedB ?? []).map((r) => r.id),
        ...(partnerB ?? []).map((r) => r.project_id),
      ]);
      const shared = Array.from(setA).filter((id) => setB.has(id));

      if (shared.length === 0) {
        return { projects: 0, documents: 0, pendingRequests: 0 };
      }

      const [{ count: docs }, { count: reqs }] = await Promise.all([
        supabase
          .from("project_documents")
          .select("id", { count: "exact", head: true })
          .in("project_id", shared),
        supabase
          .from("project_requests")
          .select("id", { count: "exact", head: true })
          .in("project_id", shared)
          .in("status", ["open", "Open", "pending", "Pending"]),
      ]);

      return {
        projects: shared.length,
        documents: docs ?? 0,
        pendingRequests: reqs ?? 0,
      };
    } catch {
      return { projects: 0, documents: 0, pendingRequests: 0 };
    }
  });
