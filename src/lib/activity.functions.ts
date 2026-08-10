import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminFeedEvent, FeedEventKind, FeedSeverity } from "@/lib/admin-feed";

interface OrgInfo {
  name: string;
  entityType: string;
  country: string;
  routeId: string;
}

/** Real platform activity: feed posts, project activity, meeting requests, documents. */
export const listPlatformActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminFeedEvent[]> => {
    const { supabase } = context;

    const [{ data: posts }, { data: activity }, { data: meetings }, { data: docs }] =
      await Promise.all([
        supabase
          .from("feed_posts")
          .select("id, org_id, kind, title, body, created_at")
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("project_activity")
          .select("id, project_id, actor_org_id, type, message, created_at")
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("meeting_requests")
          .select("id, requester_org_id, recipient_org_id, status, agenda, created_at")
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("org_documents")
          .select("id, org_id, title, category, created_at")
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

    const orgIds = new Set<string>();
    for (const p of posts ?? []) orgIds.add(p.org_id);
    for (const a of activity ?? []) if (a.actor_org_id) orgIds.add(a.actor_org_id);
    for (const m of meetings ?? []) orgIds.add(m.requester_org_id);
    for (const d of docs ?? []) orgIds.add(d.org_id);

    const { data: orgs } = await supabase
      .from("orgs")
      .select("id, name, entity_type, type, country, legacy_id")
      .in("id", orgIds.size ? Array.from(orgIds) : ["00000000-0000-0000-0000-000000000000"]);

    const orgById = new Map<string, OrgInfo>(
      (orgs ?? []).map((o) => [
        o.id,
        {
          name: o.name,
          entityType: (o.entity_type ?? o.type ?? "Organization") as string,
          country: o.country ?? "—",
          routeId: o.legacy_id ?? o.id,
        },
      ]),
    );

    const events: AdminFeedEvent[] = [];
    const push = (
      id: string,
      orgId: string | null,
      at: string,
      kind: FeedEventKind,
      severity: FeedSeverity,
      title: string,
      detail: string,
    ) => {
      const org = orgId ? orgById.get(orgId) : undefined;
      events.push({
        id,
        at,
        kind,
        severity,
        orgId: org?.routeId ?? orgId ?? "",
        orgName: org?.name ?? "Platform",
        entityType: (org?.entityType ?? "Organization") as AdminFeedEvent["entityType"],
        country: org?.country ?? "—",
        title,
        detail,
      });
    };

    for (const p of posts ?? []) {
      const org = orgById.get(p.org_id);
      push(
        `post-${p.id}`,
        p.org_id,
        p.created_at,
        p.kind === "partnership" ? "partnership" : "message",
        "info",
        `${org?.name ?? "An organization"} posted an update`,
        p.title || (p.body ?? "").slice(0, 140) || "New community post.",
      );
    }
    for (const a of activity ?? []) {
      push(
        `act-${a.id}`,
        a.actor_org_id,
        a.created_at,
        "project",
        "info",
        a.type ? `Project ${a.type}` : "Project activity",
        a.message,
      );
    }
    for (const m of meetings ?? []) {
      const org = orgById.get(m.requester_org_id);
      push(
        `meet-${m.id}`,
        m.requester_org_id,
        m.created_at,
        "partnership",
        m.status === "declined" ? "warning" : m.status === "accepted" ? "success" : "info",
        `Meeting request ${m.status} · ${org?.name ?? "Organization"}`,
        m.agenda,
      );
    }
    for (const d of docs ?? []) {
      push(
        `doc-${d.id}`,
        d.org_id,
        d.created_at,
        d.category === "certification" ? "certification" : "upload",
        "success",
        `${orgById.get(d.org_id)?.name ?? "An organization"} uploaded a document`,
        d.title,
      );
    }

    events.sort((a, b) => (a.at < b.at ? 1 : -1));
    return events.slice(0, 200);
  });
