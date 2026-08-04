import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getProfileDef, type ProfileAnswers } from "./entity-profiles";
import { computeProfileScore } from "./profile-score";



const orgRoleValues = ["owner", "admin", "editor", "viewer"] as const;

const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Slug must be lowercase letters, numbers, hyphens"),
  type: z.string().trim().min(2).max(80),
  country: z.string().trim().max(80).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),

  website: z.string().trim().url().max(255).optional().or(z.literal("")).nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  tier: z.number().int().min(0).max(4).optional().nullable(),
  certifications: z.array(z.string().trim().max(80)).max(30).optional().nullable(),
  logoPath: z.string().trim().max(300).optional().nullable(),
  moq: z.string().trim().max(60).optional().nullable(),
  leadTimeDays: z.number().int().min(0).max(1000).optional().nullable(),
  capacity: z.string().trim().max(120).optional().nullable(),
  onTimeRate: z.number().int().min(0).max(100).optional().nullable(),
  materials: z.array(z.string().trim().max(80)).max(40).optional().nullable(),
  capabilities: z.array(z.string().trim().max(80)).max(40).optional().nullable(),
  productCategories: z.array(z.string().trim().max(80)).max(20).optional().nullable(),
  productTypes: z.array(z.string().trim().max(80)).max(40).optional().nullable(),
  specializations: z.array(z.string().trim().max(80)).max(20).optional().nullable(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "org";
}

export const createOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createOrgSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    let slug = slugify(data.slug);
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
      if (i === 9) throw new Error("Could not find an available slug — please try another.");
    }

    let logoUrl: string | null = null;
    if (data.logoPath) {
      const { data: pub } = supabase.storage.from("org-logos").getPublicUrl(data.logoPath);
      logoUrl = pub?.publicUrl ?? null;
    }

    const { data: org, error: insErr } = await supabase
      .from("orgs")
      .insert({
        name: data.name,
        slug,
        type: data.type,
        country: data.country || null,
        website: data.website || null,
        description: data.description || null,
        size: data.size || null,
        region: data.region || null,
        tier: data.tier ?? null,
        certifications: data.certifications ?? [],
        logo_url: logoUrl,
        moq: data.moq || null,
        lead_time_days: data.leadTimeDays ?? null,
        capacity: data.capacity || null,
        on_time_rate: data.onTimeRate ?? null,
        materials: data.materials ?? [],
        capabilities: data.capabilities ?? [],
        product_categories: data.productCategories ?? [],
        product_types: data.productTypes ?? [],
        specializations: data.specializations ?? [],
      })
      .select("id, slug")
      .single();
    if (insErr) throw new Error(insErr.message);

    const meta = (claims as { user_metadata?: Record<string, unknown>; email?: string } | undefined) ?? {};
    const userMeta = (meta.user_metadata as Record<string, unknown> | undefined) ?? {};
    const displayName =
      (userMeta.full_name as string | undefined) ||
      (userMeta.name as string | undefined) ||
      (meta.email ? String(meta.email).split("@")[0] : "Owner");
    const avatarUrl = (userMeta.avatar_url as string | undefined) || null;

    const { error: memErr } = await supabase.from("org_members").insert({
      org_id: org.id,
      user_id: userId,
      role: "owner",
      display_name: displayName,
      avatar_url: avatarUrl,
    });
    if (memErr) {
      await supabase.from("orgs").delete().eq("id", org.id);
      throw new Error(memErr.message);
    }

    return { id: org.id, slug: org.slug };
  });

export const checkSlugAvailable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(2).max(64) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("orgs")
      .select("id")
      .eq("slug", slugify(data.slug))
      .maybeSingle();
    return { available: !row };
  });

export const myOrgMemberships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("org_members")
      .select("org_id, role, orgs(name)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      org_id: r.org_id as string,
      role: r.role as string,
      org_name: ((r as { orgs?: { name?: string } | null }).orgs?.name ?? "Organization") as string,
    }));
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _rolesUnused: readonly string[] = orgRoleValues;

const updateOpsSchema = z.object({
  orgId: z.string().uuid(),
  moq: z.string().trim().max(60).optional().nullable(),
  leadTimeDays: z.number().int().min(0).max(1000).optional().nullable(),
  capacity: z.string().trim().max(120).optional().nullable(),
  onTimeRate: z.number().int().min(0).max(100).optional().nullable(),
  materials: z.array(z.string().trim().max(80)).max(40).optional().nullable(),
  capabilities: z.array(z.string().trim().max(80)).max(40).optional().nullable(),
  specializations: z.array(z.string().trim().max(80)).max(20).optional().nullable(),
});

export const updateOrgOperations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateOpsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: canEdit, error: roleErr } = await supabase.rpc("user_can_edit", {
      _user: userId,
      _org: data.orgId,
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!canEdit) throw new Error("You don't have permission to edit this organization.");

    const patch: Record<string, unknown> = {};
    if (data.moq !== undefined) patch.moq = data.moq;
    if (data.leadTimeDays !== undefined) patch.lead_time_days = data.leadTimeDays;
    if (data.capacity !== undefined) patch.capacity = data.capacity;
    if (data.onTimeRate !== undefined) patch.on_time_rate = data.onTimeRate;
    if (data.materials !== undefined) patch.materials = data.materials ?? [];
    if (data.capabilities !== undefined) patch.capabilities = data.capabilities ?? [];
    if (data.specializations !== undefined) patch.specializations = data.specializations ?? [];

    const { error } = await supabase.from("orgs").update(patch as never).eq("id", data.orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const profileSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  type: z.string().trim().min(2).max(80).optional(),
  country: z.string().trim().max(80).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  certifications: z.array(z.string().trim().max(80)).max(40).optional().nullable(),
  materials: z.array(z.string().trim().max(80)).max(60).optional().nullable(),
  capabilities: z.array(z.string().trim().max(80)).max(60).optional().nullable(),
  productCategories: z.array(z.string().trim().max(80)).max(30).optional().nullable(),
  productTypes: z.array(z.string().trim().max(80)).max(60).optional().nullable(),
  specializations: z.array(z.string().trim().max(80)).max(30).optional().nullable(),
  moq: z.string().trim().max(60).optional().nullable(),
  leadTimeDays: z.number().int().min(0).max(1000).optional().nullable(),
  deliveryTimeframeDays: z.number().int().min(0).max(1000).optional().nullable(),
  avgDelayDays: z.number().int().min(0).max(365).optional().nullable(),
  capacity: z.string().trim().max(120).optional().nullable(),
  onTimeRate: z.number().int().min(0).max(100).optional().nullable(),
});

/** Full organization profile update — owners/admins of the org only. */
export const updateOrgProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: canManage, error: roleErr } = await supabase.rpc("user_can_manage", {
      _user: userId,
      _org: data.orgId,
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!canManage) throw new Error("Only organization owners and admins can edit the profile.");

    const map: Record<string, string> = {
      name: "name",
      type: "type",
      country: "country",
      region: "region",
      city: "city",
      website: "website",
      description: "description",
      size: "size",
      logoUrl: "logo_url",
      certifications: "certifications",
      materials: "materials",
      capabilities: "capabilities",
      productCategories: "product_categories",
      productTypes: "product_types",
      specializations: "specializations",
      moq: "moq",
      leadTimeDays: "lead_time_days",
      deliveryTimeframeDays: "delivery_timeframe_days",
      avgDelayDays: "avg_delay_days",
      capacity: "capacity",
      onTimeRate: "on_time_rate",
    };
    const patch: Record<string, unknown> = {};
    for (const [key, column] of Object.entries(map)) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) patch[column] = value;
    }
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await supabase.from("orgs").update(patch as never).eq("id", data.orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
