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
  operatingCountries: z.array(z.string().trim().max(80)).max(50).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  zipCode: z.string().trim().max(30).optional().nullable(),

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
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "org"
  );
}

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const createOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createOrgSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const adminSb = supabaseAdmin as any;

    let slug = slugify(data.slug);
    for (let i = 0; i < 10; i++) {
      const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
      const { data: existing } = await adminSb
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

    const meta =
      (claims as { user_metadata?: Record<string, unknown>; email?: string } | undefined) ?? {};
    const userMeta = (meta.user_metadata as Record<string, unknown> | undefined) ?? {};
    const userEmail = meta.email || (claims as any)?.email || "";
    const displayName =
      (userMeta.full_name as string | undefined) ||
      (userMeta.name as string | undefined) ||
      (userEmail ? String(userEmail).split("@")[0] : "Owner");
    const avatarUrl = (userMeta.avatar_url as string | undefined) || null;

    const initialContacts = [
      {
        name: displayName,
        email: userEmail,
        role: "Organization Owner",
        phone: "",
      },
    ];

    const insertData: Record<string, unknown> = {
      created_by: userId,
      name: data.name,
      slug,
      type: data.type,
      country: data.country || null,
      city: data.city || null,
      address: data.address || null,
      zip_code: data.zipCode || null,
      contacts: initialContacts,
      profile_answers: {
        operating_countries:
          data.operatingCountries ?? (data.country ? [data.country] : []),
      },
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
    };
    if (data.operatingCountries || data.country) {
      insertData.operating_countries =
        data.operatingCountries ?? (data.country ? [data.country] : []);
    }

    let { data: org, error: insErr } = await adminSb
      .from("orgs")
      .insert(insertData)
      .select("id, slug")
      .single();

    if (insErr && insErr.message.includes("operating_countries")) {
      delete insertData.operating_countries;
      const retry = await adminSb
        .from("orgs")
        .insert(insertData)
        .select("id, slug")
        .single();
      org = retry.data;
      insErr = retry.error;
    }
    if (insErr) throw new Error(insErr.message);

    const { error: memErr } = await adminSb.from("org_members").insert({
      org_id: org.id,
      user_id: userId,
      role: "owner",
      display_name: displayName,
      avatar_url: avatarUrl,
    });
    if (memErr) {
      await adminSb.from("orgs").delete().eq("id", org.id);
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

/**
 * Memberships for the signed-in user. Returns [] instead of throwing when the
 * request has no bearer token (signed-out / auth page), so callers never crash.
 */
export const myOrgMemberships = createServerFn({ method: "GET" }).handler(async () => {
  const empty: {
    org_id: string;
    role: string;
    org_name: string;
    onboarding_completed_at: string | null;
  }[] = [];
  const { getRequest } = await import("@tanstack/react-start/server");
  const authHeader = getRequest()?.headers?.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return empty;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );

  const { data: claims } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (!userId) return empty;

  const { data, error } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(name, onboarding_completed_at)")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => {
    const org = (r as { orgs?: { name?: string; onboarding_completed_at?: string | null } | null })
      .orgs;
    return {
      org_id: r.org_id as string,
      role: r.role as string,
      org_name: (org?.name ?? "Organization") as string,
      onboarding_completed_at: (org?.onboarding_completed_at ?? null) as string | null,
    };
  });
});

/** Marks an organization's setup flow as finished. */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: canEdit, error: roleErr } = await supabase.rpc("user_can_edit", {
      _user: userId,
      _org: data.orgId,
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!canEdit) throw new Error("You don't have permission to edit this organization.");

    const { error } = await supabase
      .from("orgs")
      .update({ onboarding_completed_at: new Date().toISOString() } as never)
      .eq("id", data.orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
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

    const { error } = await supabase
      .from("orgs")
      .update(patch as never)
      .eq("id", data.orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const profileSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  type: z.string().trim().min(2).max(80).optional(),
  country: z.string().trim().max(80).optional().nullable(),
  operatingCountries: z.array(z.string().trim().max(80)).max(50).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  zipCode: z.string().trim().max(30).optional().nullable(),
  website: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  bannerUrls: z.array(z.string().trim().max(500)).max(8).optional().nullable(),
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
      operatingCountries: "operating_countries",
      region: "region",
      city: "city",
      address: "address",
      zipCode: "zip_code",
      website: "website",
      description: "description",
      size: "size",
      logoUrl: "logo_url",
      bannerUrls: "banner_urls",
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

    if (data.operatingCountries !== undefined) {
      const { data: details } = await supabase.rpc("org_private_details", { _org: data.orgId });
      const currentAnswers = ((Array.isArray(details) ? details[0] : details)?.profile_answers ??
        {}) as Record<string, unknown>;
      patch.profile_answers = {
        ...currentAnswers,
        operating_countries: data.operatingCountries,
      };
    }

    if (Object.keys(patch).length === 0) return { ok: true };

    let { error } = await supabase
      .from("orgs")
      .update(patch as never)
      .eq("id", data.orgId);

    if (error && error.message.includes("operating_countries")) {
      delete patch["operating_countries"];
      const retry = await supabase
        .from("orgs")
        .update(patch as never)
        .eq("id", data.orgId);
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    return { ok: true };
  });

const answersSchema = z.object({
  orgId: z.string().uuid(),
  answers: z.record(
    z.string().max(80),
    z.union([z.string().max(4000), z.number(), z.array(z.string().max(120)).max(60), z.null()]),
  ),
});

/**
 * Persists the entity-specific onboarding questionnaire. Answers mapped to a
 * real `orgs` column are mirrored there (so directory, search and matchmaking
 * keep working); everything else is stored in `profile_answers`. The weighted
 * profile score is recomputed server-side on every save.
 */
export const saveOrgProfileAnswers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => answersSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: canEdit, error: roleErr } = await supabase.rpc("user_can_edit", {
      _user: userId,
      _org: data.orgId,
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!canEdit) throw new Error("You don't have permission to edit this organization.");

    const { data: org, error: orgErr } = await supabase
      .from("orgs")
      .select("id, type, entity_type, description, website, city, country, logo_url")
      .eq("id", data.orgId)
      .single();
    if (orgErr) throw new Error(orgErr.message);

    const { data: privateRows } = await supabase.rpc("org_private_details", { _org: data.orgId });
    const existing = ((Array.isArray(privateRows) ? privateRows[0] : privateRows)
      ?.profile_answers ?? {}) as ProfileAnswers;
    const merged: ProfileAnswers = { ...existing, ...(data.answers as ProfileAnswers) };

    const entityType = (org.entity_type as string | null) || (org.type as string | null) || "";
    const def = getProfileDef(entityType);

    const columnMap: Record<string, string> = {
      materials: "materials",
      capabilities: "capabilities",
      certifications: "certifications",
      productCategories: "product_categories",
      productTypes: "product_types",
      specializations: "specializations",
      capacity: "capacity",
      moq: "moq",
      leadTimeDays: "lead_time_days",
    };
    const arrayColumns = new Set([
      "materials",
      "capabilities",
      "certifications",
      "product_categories",
      "product_types",
      "specializations",
    ]);

    const patch: Record<string, unknown> = {};
    for (const field of def.fields) {
      if (!field.column) continue;
      const value = merged[field.id];
      if (value === undefined) continue;
      const column = columnMap[field.column];
      if (!column) continue;
      if (arrayColumns.has(column)) {
        const next = Array.isArray(value) ? value : value ? [String(value)] : [];
        const prev = (patch[column] as string[] | undefined) ?? [];
        patch[column] = Array.from(new Set([...prev, ...next]));
      } else if (column === "lead_time_days") {
        const n = typeof value === "number" ? value : Number(value);
        patch[column] = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
      } else {
        patch[column] = value === null || value === "" ? null : String(value);
      }
    }

    const result = computeProfileScore(entityType, merged, {
      description: (org.description as string | null) ?? undefined,
      website: (org.website as string | null) ?? undefined,
      city: (org.city as string | null) ?? undefined,
      country: (org.country as string | null) ?? undefined,
      logoUrl: (org.logo_url as string | null) ?? undefined,
    });

    patch.profile_answers = merged;
    patch.profile_score = result.score;
    patch.profile_completeness = result.score;

    const { error } = await supabase
      .from("orgs")
      .update(patch as never)
      .eq("id", data.orgId);
    if (error) throw new Error(error.message);
    return { ok: true, score: result.score };
  });

/** Reads the stored questionnaire answers plus the core fields used for scoring. */
export const getOrgProfileAnswers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: org, error } = await context.supabase
      .from("orgs")
      .select(
        "id, name, type, entity_type, description, website, city, country, logo_url, profile_score",
      )
      .eq("id", data.orgId)
      .single();
    if (error) throw new Error(error.message);
    const { data: privateRows } = await context.supabase.rpc("org_private_details", {
      _org: data.orgId,
    });
    const answers = ((Array.isArray(privateRows) ? privateRows[0] : privateRows)?.profile_answers ??
      {}) as ProfileAnswers;
    return {
      orgId: org.id as string,
      name: (org.name as string) ?? "",
      entityType: ((org.entity_type as string | null) ||
        (org.type as string | null) ||
        "") as string,
      answers,
      score: ((org as { profile_score?: number }).profile_score ?? 0) as number,
      core: {
        description: (org.description as string | null) ?? "",
        website: (org.website as string | null) ?? "",
        city: (org.city as string | null) ?? "",
        country: (org.country as string | null) ?? "",
        logoUrl: (org.logo_url as string | null) ?? "",
      },
    };
  });

export const leaveOrganizationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check member's current role
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.orgId);
    let targetOrgId = data.orgId;
    if (!isUuid) {
      const { data: orgRow } = await supabase
        .from("orgs")
        .select("id")
        .or(`slug.ilike.${data.orgId},legacy_id.ilike.${data.orgId},name.ilike.${data.orgId}`)
        .maybeSingle();
      if (orgRow?.id) targetOrgId = orgRow.id;
    }

    const { data: member } = await supabase
      .from("org_members")
      .select("id, role")
      .eq("org_id", targetOrgId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!member) {
      throw new Error("You are not a member of this organization.");
    }

    if (member.role === "owner") {
      throw new Error(
        "As an owner, you cannot leave this organization. Please transfer ownership to another member or delete the organization in Settings.",
      );
    }

    const { error } = await supabase.from("org_members").delete().eq("id", member.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Private organization fields (contacts, comments, governance, traceability
 * notes). Restricted at the database level to the org's own members, orgs with
 * an accepted connection, and platform admins.
 */
export const getOrgPrivateDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase.rpc("org_private_details", {
      _org: data.orgId,
    });
    const row = (Array.isArray(rows) ? rows[0] : rows) as
      | {
          contacts?: unknown;
          comments?: string | null;
          governance?: string | null;
          traceability_notes?: string | null;
        }
      | null
      | undefined;
    return {
      contacts: (Array.isArray(row?.contacts) ? row?.contacts : []) as Array<{
        name?: string;
        role?: string;
        email?: string;
        phone?: string;
      }>,
      comments: row?.comments ?? "",
      governance: row?.governance ?? "",
      traceabilityNotes: row?.traceability_notes ?? "",
    };
  });
