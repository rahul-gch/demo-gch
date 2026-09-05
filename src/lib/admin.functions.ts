import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_platform_admin", {
    _user: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — platform admins only.");
}

/**
 * A soft-auth status probe used by protected route guards and shared shells.
 * During initial client hydration the auth session can still be restoring, so
 * a missing bearer token must resolve to "not an admin" rather than blanking
 * the application. All privileged admin operations below remain protected by
 * requireSupabaseAuth and assertAdmin.
 */
export const amIPlatformAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  const authHeader = getRequest()?.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!token || !url || !key) return { isAdmin: false };

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return { isAdmin: false };

  const { data, error } = await supabase.rpc("is_platform_admin", { _user: userId });
  if (error) return { isAdmin: false };
  return { isAdmin: Boolean(data) };
});

export interface AdminDashboardStats {
  orgs: number;
  countries: number;
  members: number;
  membersByRole: { role: string; count: number }[];
  activeProjects: number;
  pendingConnections: number;
  pendingMeetings: number;
  ordersAwaitingQuote: number;
  ordersAwaitingConfirmation: number;
  openInvites: number;
  unclaimedOrgs: number;
  incompleteOnboarding: number;
  unresolvedErrors: number;
  errors24h: number;
  growth: { id: string; label: string; total: number; last30: number; prev30: number }[];
}

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboardStats> => {
    await assertAdmin(context);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const now = Date.now();
    const d30 = new Date(now - 30 * 86400_000).toISOString();
    const d60 = new Date(now - 60 * 86400_000).toISOString();
    const d1 = new Date(now - 86400_000).toISOString();
    const nowIso = new Date(now).toISOString();

    const count = async (table: string, apply?: (q: any) => any) => {
      let q: any = db.from(table as any).select("id", { count: "exact", head: true });
      if (apply) q = apply(q);
      const { count: c, error } = await q;
      if (error) throw new Error(`${table}: ${error.message}`);
      return (c as number | null) ?? 0;
    };
    const windowed = async (table: string, apply?: (q: any) => any) => {
      const base = (q: any) => (apply ? apply(q) : q);
      const [total, last30, prev30] = await Promise.all([
        count(table, apply),
        count(table, (q) => base(q).gte("created_at", d30)),
        count(table, (q) => base(q).gte("created_at", d60).lt("created_at", d30)),
      ]);
      return { total, last30, prev30 };
    };

    const [
      orgCountries,
      memberRoles,
      activeProjects,
      pendingConnections,
      pendingMeetings,
      ordersAwaitingQuote,
      ordersAwaitingConfirmation,
      openInvites,
      claimedOrgIds,
      incompleteOnboarding,
      unresolvedErrors,
      errors24h,
      gOrgs,
      gMembers,
      gMessages,
      gPosts,
      gConnections,
    ] = await Promise.all([
      db.from("orgs").select("id, country"),
      db.from("org_members").select("role"),
      count("projects", (q) => q.eq("status", "Active")),
      count("org_connections", (q) => q.eq("status", "pending")),
      count("meeting_requests", (q) => q.eq("status", "pending")),
      count("sample_orders", (q) => q.eq("status", "requested")),
      count("sample_orders", (q) => q.eq("status", "quoted")),
      count("platform_invites", (q) =>
        q.is("revoked_at", null).is("accepted_at", null).gt("expires_at", nowIso),
      ),
      db.from("org_members").select("org_id"),
      count("orgs", (q) => q.is("onboarding_completed_at", null)),
      count("app_errors", (q) => q.is("resolved_at", null)),
      count("app_errors", (q) => q.gte("occurred_at", d1)),
      windowed("orgs"),
      windowed("org_members", (q) => q.not("user_id", "is", null)),
      windowed("messages"),
      windowed("feed_posts"),
      windowed("org_connections", (q) => q.eq("status", "accepted")),
    ]);

    const orgRows = orgCountries.data ?? [];
    const countries = new Set(orgRows.map((o) => o.country).filter(Boolean)).size;
    const claimed = new Set((claimedOrgIds.data ?? []).map((m) => m.org_id));
    const roleCounts = new Map<string, number>();
    for (const m of memberRoles.data ?? []) {
      roleCounts.set(m.role, (roleCounts.get(m.role) ?? 0) + 1);
    }
    const membersByRole = ["owner", "admin", "editor", "viewer"].map((role) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1) + "s",
      count: roleCounts.get(role) ?? 0,
    }));

    return {
      orgs: orgRows.length,
      countries,
      members: (memberRoles.data ?? []).length,
      membersByRole,
      activeProjects,
      pendingConnections,
      pendingMeetings,
      ordersAwaitingQuote,
      ordersAwaitingConfirmation,
      openInvites,
      unclaimedOrgs: orgRows.filter((o) => !claimed.has(o.id)).length,
      incompleteOnboarding,
      unresolvedErrors,
      errors24h,
      growth: [
        { id: "orgs", label: "Organizations", ...gOrgs },
        { id: "members", label: "Members", ...gMembers },
        { id: "messages", label: "Messages", ...gMessages },
        { id: "posts", label: "Feed posts", ...gPosts },
        { id: "connections", label: "Connections", ...gConnections },
      ],
    };
  });


export const listRecentSignups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).default(25) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: orgs, error } = await context.supabase
      .from("orgs")
      .select("id, name, slug, type, country, created_at, logo_url")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const ids = (orgs ?? []).map((o: { id: string }) => o.id);
    const { data: members } = ids.length
      ? await context.supabase
          .from("org_members")
          .select("org_id, user_id, display_name, role, joined_at")
          .in("org_id", ids)
      : { data: [] as any[] };

    const byOrg = new Map<string, any[]>();
    for (const m of members ?? []) {
      const list = byOrg.get(m.org_id) ?? [];
      list.push(m);
      byOrg.set(m.org_id, list);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emailCache = new Map<string, string | null>();
    const emailFor = async (userId: string | null) => {
      if (!userId) return null;
      if (emailCache.has(userId)) return emailCache.get(userId)!;
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = u?.user?.email ?? null;
      emailCache.set(userId, email);
      return email;
    };

    const rows = [];
    for (const o of orgs ?? []) {
      const mem = byOrg.get(o.id) ?? [];
      const owner = mem.find((m) => m.role === "owner") ?? mem[0] ?? null;
      rows.push({
        ...o,
        memberCount: mem.length,
        ownerName: owner?.display_name ?? null,
        ownerEmail: await emailFor(owner?.user_id ?? null),
        claimed: mem.length > 0,
      });
    }
    return rows;
  });

const createInviteSchema = z.object({
  email: z.string().trim().email().max(255).optional().nullable(),
  role: z.enum(["owner", "admin", "editor", "viewer"]).default("owner"),
  note: z.string().trim().max(500).optional().nullable(),
  expiresInDays: z.number().int().min(1).max(180).default(30),
  // Optional org shell to create and attach
  orgName: z.string().trim().min(2).max(120).optional().nullable(),
  orgType: z.string().trim().min(2).max(120).optional().nullable(),
  orgCountry: z.string().trim().max(120).optional().nullable(),
  targetOrgId: z.string().uuid().optional().nullable(),
});

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "org"
  );
}

export const createPlatformInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInviteSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;

    let targetOrgId = data.targetOrgId ?? null;

    if (!targetOrgId && data.orgName && data.orgType) {
      let slug = slugify(data.orgName);
      for (let i = 0; i < 10; i++) {
        const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
        const { data: existing } = await supabase
          .from("orgs")
          .select("id")
          .eq("slug", candidate)
          .maybeSingle();
        if (!existing) {
          slug = candidate;
          break;
        }
      }
      const { data: org, error } = await supabase
        .from("orgs")
        .insert({
          name: data.orgName,
          slug,
          type: data.orgType,
          country: data.orgCountry || null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      targetOrgId = org.id;
    }

    const expiresAt = new Date(Date.now() + data.expiresInDays * 86400_000).toISOString();
    const { data: row, error } = await supabase
      .from("platform_invites")
      .insert({
        email: data.email || null,
        org_name: data.orgName || null,
        target_org_id: targetOrgId,
        role: data.role,
        note: data.note || null,
        expires_at: expiresAt,
        invited_by: userId,
      })
      .select("id, token, email, org_name, target_org_id, role, expires_at, uses, max_uses")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listPlatformInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("platform_invites")
      .select(
        "id, email, org_name, target_org_id, role, token, note, uses, max_uses, expires_at, revoked_at, accepted_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const revokePlatformInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("platform_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public lookup of an onboarding invite — token-gated, server-side only.
export const lookupPlatformInvite = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(4).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_platform_invite_by_token", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ?? null;
  });

export const acceptPlatformInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(4).max(200),
        displayName: z.string().trim().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: orgId, error } = await context.supabase.rpc("accept_platform_invite", {
      _token: data.token,
      _display_name: data.displayName,
    });
    if (error) throw new Error(error.message);
    return { orgId: (orgId as string | null) ?? null };
  });
