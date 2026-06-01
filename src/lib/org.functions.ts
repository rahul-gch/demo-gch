import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Seeded organisations (mirrors src/lib/ecosystem-data.ts ORGS subset)
const SEED_ORGS = [
  { slug: "acme",      name: "Acme Apparel",      type: "brand",    country: "Portugal", region: "EU",       size: "L", tier: 1, certifications: ["GOTS", "RCS"],         description: "Premium organic apparel brand." },
  { slug: "northwind", name: "Northwind Mills",   type: "supplier", country: "Portugal", region: "EU",       size: "L", tier: 2, certifications: ["GOTS", "OEKO-TEX"],    description: "Vertically integrated knit & woven mill." },
  { slug: "starkv",    name: "Stark Verification",type: "verifier", country: "UK",       region: "EU",       size: "M", tier: 2, certifications: ["SMETA 4P", "ISO 17021"], description: "Independent third-party audit body." },
  { slug: "lumon",     name: "Lumon Outerwear",   type: "brand",    country: "USA",      region: "Americas", size: "L", tier: 1, certifications: ["RCS", "BlueSign"],     description: "Technical outdoor outerwear." },
  { slug: "wayne",     name: "Wayne Heritage",    type: "brand",    country: "UK",       region: "EU",       size: "M", tier: 1, certifications: ["GOTS"],                description: "Heritage British clothing brand." },
  { slug: "initech",   name: "Initech Basics",    type: "brand",    country: "Germany",  region: "EU",       size: "M", tier: 1, certifications: ["GOTS", "OEKO-TEX"],    description: "Essentials at scale." },
  { slug: "cyber",     name: "Cyberdyne Active",  type: "brand",    country: "Japan",    region: "APAC",     size: "M", tier: 1, certifications: ["BlueSign"],            description: "Performance activewear." },
  { slug: "tyrell",    name: "Tyrell Dyeworks",   type: "supplier", country: "Portugal", region: "EU",       size: "M", tier: 2, certifications: ["GOTS", "BlueSign"],    description: "Low-impact dye specialist." },
  { slug: "hooli",     name: "Hooli Knit",        type: "supplier", country: "Portugal", region: "EU",       size: "S", tier: 2, certifications: ["OEKO-TEX"],           description: "Boutique knitting facility." },
  { slug: "ouroboros", name: "Ouroboros Audit",   type: "verifier", country: "Netherlands", region: "EU",    size: "L", tier: 2, certifications: ["SMETA 4P", "ZDHC"],    description: "Pan-European audit firm." },
];

// Persona email → org + ghost teammates seeded with them.
const PERSONA_OWNERSHIP: Record<string, { orgSlug: string; displayName: string; title: string; teammates: { name: string; title: string; role: "admin" | "editor" | "viewer" }[] }> = {
  "rahul@gch.local":  { orgSlug: "acme",      displayName: "Rahul",   title: "Brand Lead",         teammates: [
    { name: "Priya Shah",   title: "Sustainability Manager", role: "admin" },
    { name: "Sam Webb",     title: "Product Developer",      role: "editor" },
    { name: "Leah Park",    title: "Sourcing Analyst",       role: "viewer" },
  ]},
  "george@gch.local": { orgSlug: "northwind", displayName: "George",  title: "Operations Lead",    teammates: [
    { name: "Joana Pires",  title: "Production Manager",     role: "admin" },
    { name: "Bruno Lopes",  title: "Quality Engineer",       role: "editor" },
    { name: "Marta Silva",  title: "Logistics",              role: "viewer" },
  ]},
  "maria@gch.local":  { orgSlug: "starkv",    displayName: "Maria",   title: "Lead Reviewer",      teammates: [
    { name: "Tom Becker",   title: "Senior Auditor",         role: "admin" },
    { name: "Lia Romano",   title: "Evidence Analyst",       role: "editor" },
    { name: "Owen Wright",  title: "Compliance Trainee",     role: "viewer" },
  ]},
};

/**
 * Idempotent seed: upserts orgs, makes the calling user Owner of their persona's org,
 * and inserts ghost teammates the first time.
 */
export const ensureSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims?.email as string | undefined)?.toLowerCase();

    // Upsert all seed orgs
    for (const o of SEED_ORGS) {
      await supabaseAdmin.from("orgs").upsert({
        slug: o.slug, name: o.name, type: o.type, country: o.country,
        region: o.region, size: o.size, tier: o.tier,
        certifications: o.certifications, description: o.description,
      }, { onConflict: "slug" });
    }

    if (!email || !PERSONA_OWNERSHIP[email]) return { seeded: false, reason: "not a persona" };

    const persona = PERSONA_OWNERSHIP[email];
    const { data: org } = await supabaseAdmin.from("orgs").select("id").eq("slug", persona.orgSlug).single();
    if (!org) return { seeded: false, reason: "org missing" };

    // Owner membership for the real user
    await supabaseAdmin.from("org_members").upsert({
      org_id: org.id, user_id: userId,
      display_name: persona.displayName, title: persona.title,
      role: "owner",
    }, { onConflict: "org_id,user_id" });

    // Ghost teammates — insert only if org has fewer than expected members
    const { count } = await supabaseAdmin
      .from("org_members").select("*", { count: "exact", head: true })
      .eq("org_id", org.id);
    if ((count ?? 0) < persona.teammates.length + 1) {
      for (const t of persona.teammates) {
        const { data: existing } = await supabaseAdmin
          .from("org_members").select("id").eq("org_id", org.id).eq("display_name", t.name).maybeSingle();
        if (!existing) {
          await supabaseAdmin.from("org_members").insert({
            org_id: org.id, user_id: null,
            display_name: t.name, title: t.title, role: t.role,
          });
        }
      }
    }

    return { seeded: true, orgSlug: persona.orgSlug };
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
    // Only an Owner can grant the Owner role.
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
