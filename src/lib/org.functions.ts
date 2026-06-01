import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Returns the calling user's session: their primary org membership + admin flag. */
export const getMySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims?.email as string | undefined) ?? "";
    const displayName =
      (claims?.user_metadata as { display_name?: string } | undefined)?.display_name ??
      email.split("@")[0] ??
      "Member";

    const { data: membership } = await supabaseAdmin
      .from("org_members")
      .select("role, orgs:org_id(id, slug, name, type)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then((r) => r, () => ({ data: null }));

    const org = (membership?.orgs as { id: string; slug: string; name: string; type: string } | null) ?? null;

    return {
      userId,
      email,
      displayName,
      isAdmin: !!roleRow,
      orgId: org?.id ?? null,
      orgSlug: org?.slug ?? null,
      orgName: org?.name ?? null,
      orgType: org?.type ?? null,
      memberRole: (membership?.role as string | undefined) ?? null,
    };
  });

/** Creates the calling user's organisation and makes them Owner. Idempotent if slug exists they get an error. */
export const createMyOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().min(2).max(120),
      type: z.enum(["brand", "supplier", "verifier", "regulator"]),
      country: z.string().min(2).max(64),
      website: z.string().url().max(255).optional().or(z.literal("")),
      description: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const displayName =
      (claims?.user_metadata as { display_name?: string } | undefined)?.display_name ??
      (claims?.email as string | undefined)?.split("@")[0] ??
      "Owner";

    // Slugify
    const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "org";
    let slug = baseSlug;
    for (let i = 2; ; i++) {
      const { data: existing } = await supabaseAdmin.from("orgs").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i}`;
      if (i > 50) throw new Error("Could not generate a unique slug");
    }

    const { data: org, error } = await supabaseAdmin
      .from("orgs")
      .insert({
        slug,
        name: data.name,
        type: data.type,
        country: data.country,
        website: data.website || null,
        description: data.description ?? null,
        certifications: [],
      })
      .select("id, slug")
      .single();
    if (error || !org) throw new Error(error?.message ?? "Failed to create organisation");

    const { error: memErr } = await supabaseAdmin.from("org_members").insert({
      org_id: org.id,
      user_id: userId,
      role: "owner",
      display_name: displayName,
      title: "Owner",
    });
    if (memErr) throw new Error(memErr.message);

    return { orgId: org.id, slug: org.slug };
  });

export const getOrgBySlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: org, error } = await supabase.from("orgs").select("*").eq("slug", data.slug).single();
    if (error || !org) throw new Error("Org not found");

    const { data: members } = await supabase.from("org_members")
      .select("id, user_id, display_name, title, avatar_url, role, joined_at")
      .eq("org_id", org.id).order("joined_at", { ascending: true });

    const myRole = members?.find((m) => m.user_id === userId)?.role ?? null;

    return { org, members: members ?? [], myRole };
  });

export const listOrgDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: docs, error } = await supabase.from("org_documents")
      .select("id, category, title, description, storage_path, mime_type, size_bytes, uploaded_by, created_at")
      .eq("org_id", data.orgId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { documents: docs ?? [] };
  });

export const updateOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orgId: z.string().uuid(),
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional().nullable(),
    website: z.string().url().max(255).optional().nullable(),
    country: z.string().max(64).optional().nullable(),
    certifications: z.array(z.string().max(64)).max(20).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { orgId, ...patch } = data;
    const { error } = await supabase.from("orgs").update(patch).eq("id", orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const inviteGhostMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orgId: z.string().uuid(),
    displayName: z.string().min(1).max(120),
    title: z.string().max(120).optional(),
    role: z.enum(["admin", "editor", "viewer"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("org_members").insert({
      org_id: data.orgId, user_id: null,
      display_name: data.displayName, title: data.title ?? null, role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    memberId: z.string().uuid(),
    role: z.enum(["owner", "admin", "editor", "viewer"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.role === "owner") {
      const { data: target } = await supabase.from("org_members").select("org_id").eq("id", data.memberId).single();
      if (target) {
        const { data: me } = await supabase.from("org_members").select("role").eq("org_id", target.org_id).eq("user_id", userId).single();
        if (me?.role !== "owner") throw new Error("Only an Owner can promote to Owner");
      }
    }
    const { error } = await supabase.from("org_members").update({ role: data.role }).eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("org_members").delete().eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    orgId: z.string().uuid(),
    category: z.enum(["certification", "evidence", "org_document"]),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    storagePath: z.string().min(1).max(500),
    mimeType: z.string().max(120).optional(),
    sizeBytes: z.number().int().min(0).max(20 * 1024 * 1024).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("org_documents").insert({
      org_id: data.orgId, uploaded_by: userId,
      category: data.category, title: data.title,
      description: data.description ?? null, storage_path: data.storagePath,
      mime_type: data.mimeType ?? null, size_bytes: data.sizeBytes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: doc } = await supabase.from("org_documents").select("storage_path").eq("id", data.documentId).single();
    const { error } = await supabase.from("org_documents").delete().eq("id", data.documentId);
    if (error) throw new Error(error.message);
    if (doc?.storage_path) {
      await supabase.storage.from("org-docs").remove([doc.storage_path]).catch(() => {});
    }
    return { ok: true };
  });
