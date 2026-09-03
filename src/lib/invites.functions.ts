import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOrgRole } from "@/lib/rbac.server";

// Public lookup — token-gated. Runs server-side only via the privileged client,
// so the RPC itself no longer needs to be executable by anonymous callers.
export const lookupInvite = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(4).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_invite_by_token", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return null;
    return row;
  });

// Accept invite — authenticated only
export const acceptInvite = createServerFn({ method: "POST" })
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
    const { data: orgId, error } = await context.supabase.rpc("accept_invite", {
      _token: data.token,
      _display_name: data.displayName,
    });
    if (error) throw new Error(error.message);
    return { orgId };
  });

// Create invite (email or shareable link)
export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        email: z.string().trim().email().max(255).optional().nullable(),
        role: z.enum(["owner", "admin", "editor", "viewer"]),
        maxUses: z.number().int().min(1).max(500).default(1),
        expiresInDays: z.number().int().min(1).max(90).default(14),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOrgRole(context.supabase, context.userId, data.orgId, "admin");

    const expiresAt = new Date(Date.now() + data.expiresInDays * 86400_000).toISOString();
    const { data: row, error } = await context.supabase
      .from("org_invites")
      .insert({
        org_id: data.orgId,
        email: data.email || null,
        role: data.role,
        max_uses: data.email ? 1 : data.maxUses,
        expires_at: expiresAt,
        invited_by: context.userId,
      })
      .select("id, token, email, role, expires_at, max_uses, uses")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertOrgRole(context.supabase, context.userId, data.orgId, "admin");

    const { data: rows, error } = await context.supabase
      .from("org_invites")
      .select(
        "id, email, role, token, max_uses, uses, expires_at, revoked_at, accepted_at, created_at",
      )
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: invite } = await context.supabase
      .from("org_invites")
      .select("org_id")
      .eq("id", data.id)
      .single();
    if (invite?.org_id) {
      await assertOrgRole(context.supabase, context.userId, invite.org_id, "admin");
    }

    const { error } = await context.supabase
      .from("org_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertOrgRole(context.supabase, context.userId, data.orgId, "viewer");

    const { data: rows, error } = await context.supabase
      .from("org_members")
      .select("id, user_id, display_name, role, title, joined_at")
      .eq("org_id", data.orgId)
      .order("joined_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        role: z.enum(["owner", "admin", "editor", "viewer"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: targetMember } = await context.supabase
      .from("org_members")
      .select("org_id, role")
      .eq("id", data.id)
      .single();
    if (targetMember?.org_id) {
      // Demoting or promoting an owner requires owner rank
      const requiredRole = targetMember.role === "owner" || data.role === "owner" ? "owner" : "admin";
      await assertOrgRole(context.supabase, context.userId, targetMember.org_id, requiredRole);
    }

    const { error } = await context.supabase
      .from("org_members")
      .update({ role: data.role })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: targetMember } = await context.supabase
      .from("org_members")
      .select("org_id, role")
      .eq("id", data.id)
      .single();
    if (targetMember?.org_id) {
      const requiredRole = targetMember.role === "owner" ? "owner" : "admin";
      await assertOrgRole(context.supabase, context.userId, targetMember.org_id, requiredRole);
    }

    const { error } = await context.supabase.from("org_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
