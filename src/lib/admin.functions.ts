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
    const { data, error } = await (context.supabase as any).rpc("admin_dashboard_stats");
    if (error) throw new Error(error.message);
    const raw = (data ?? {}) as Record<string, any>;
    const n = (v: unknown) => Number(v ?? 0);
    const byRole = (raw.membersByRole ?? {}) as Record<string, number>;
    const g = (raw.growth ?? {}) as Record<string, { total: number; last30: number; prev30: number }>;
    const win = (k: string) => ({
      total: n(g[k]?.total),
      last30: n(g[k]?.last30),
      prev30: n(g[k]?.prev30),
    });
    return {
      orgs: n(raw.orgs),
      countries: n(raw.countries),
      members: n(raw.members),
      membersByRole: ["owner", "admin", "editor", "viewer"].map((role) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1) + "s",
        count: n(byRole[role]),
      })),
      activeProjects: n(raw.activeProjects),
      pendingConnections: n(raw.pendingConnections),
      pendingMeetings: n(raw.pendingMeetings),
      ordersAwaitingQuote: n(raw.ordersAwaitingQuote),
      ordersAwaitingConfirmation: n(raw.ordersAwaitingConfirmation),
      openInvites: n(raw.openInvites),
      unclaimedOrgs: n(raw.unclaimedOrgs),
      incompleteOnboarding: n(raw.incompleteOnboarding),
      unresolvedErrors: n(raw.unresolvedErrors),
      errors24h: n(raw.errors24h),
      growth: [
        { id: "orgs", label: "Organizations", ...win("orgs") },
        { id: "members", label: "Members", ...win("members") },
        { id: "messages", label: "Messages", ...win("messages") },
        { id: "posts", label: "Feed posts", ...win("posts") },
        { id: "connections", label: "Connections", ...win("connections") },
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

export interface AdminOrgVisibilityRow {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  country: string | null;
  logo_url: string | null;
  is_hidden: boolean;
}

/** Every organization with its public-visibility state (platform admins only). */
export const listOrgVisibility = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ search: z.string().trim().max(120).optional().default("") })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<AdminOrgVisibilityRow[]> => {
    await assertAdmin(context);
    let query = context.supabase
      .from("orgs")
      .select("id, name, slug, type, country, logo_url, is_hidden")
      .order("name", { ascending: true })
      .limit(100);
    if (data.search) query = query.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdminOrgVisibilityRow[];
  });

/** Hide or unhide an organization from public discovery (platform admins only). */
export const setOrgVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ orgId: z.string().uuid(), isHidden: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("orgs")
      .update({ is_hidden: data.isHidden })
      .eq("id", data.orgId);
    if (error) throw new Error(error.message);

    await context.supabase.from("security_events").insert({
      user_id: context.userId,
      org_id: data.orgId,
      action: data.isHidden ? "org_hidden_from_public" : "org_made_public",
      target_type: "org",
      target_id: data.orgId,
      detail: {},
    });
    return { ok: true, isHidden: data.isHidden };
  });

/**
 * Minimal teaser for an organization the viewer is not allowed to see.
 * The organization's identity (name, logo, uuid) is only revealed to callers
 * who already have a relationship with it — members, platform admins, or
 * organizations with an existing connection request. Everyone else gets a
 * generic, identity-free "private organization" teaser so hidden
 * organizations stay confidential.
 */
export const getRestrictedOrgTeaser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ idOrSlug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const id = data.idOrSlug;
    const query = supabaseAdmin.from("orgs").select("id, name, logo_url, is_hidden");
    const { data: row } = uuidRe.test(id)
      ? await query.eq("id", id).maybeSingle()
      : await query.or(`slug.eq.${id},legacy_id.eq.${id}`).limit(1).maybeSingle();
    if (!row || row.is_hidden !== true) return null;

    const generic = { orgUuid: null, name: null, logoUrl: null };

    // Members, platform admins and accepted partners can already see the full
    // profile through the normal path — no teaser needed.
    const { data: canSee } = await context.supabase.rpc("viewer_can_see_hidden_org", {
      _user: context.userId,
      _org: row.id,
    });
    if (canSee) return null;

    // Reveal the identity only when the caller's own organization already has
    // a connection (of any status) with the hidden organization.
    const { data: memberships } = await context.supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", context.userId);
    const myOrgIds = (memberships ?? []).map((m) => m.org_id);
    if (myOrgIds.length > 0) {
      const { data: link } = await context.supabase
        .from("org_connections")
        .select("id")
        .or(
          `and(from_org_id.in.(${myOrgIds.join(",")}),to_org_id.eq.${row.id}),` +
            `and(to_org_id.in.(${myOrgIds.join(",")}),from_org_id.eq.${row.id})`,
        )
        .limit(1)
        .maybeSingle();
      if (link) {
        return {
          orgUuid: row.id as string,
          name: row.name as string,
          logoUrl: (row.logo_url as string | null) ?? null,
        };
      }
    }

    return generic;
  });
