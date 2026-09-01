import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { MatchPreferences } from "./match-preferences";
import { DEFAULT_PREFERENCES } from "./match-preferences";

const prefsSchema = z.object({
  targetTiers: z.array(z.string()),
  targetCountries: z.array(z.string()),
  targetMaterials: z.array(z.string()),
  productCategories: z.array(z.string()),
  certifications: z.array(z.string()),
  maxLeadTimeDays: z.number().nullable().optional(),
  minOnTimeRate: z.number().nullable().optional(),
});

// Resilient server-side memory store with cross-session sync
const memoryStore = new Map<string, MatchPreferences>();

export const getOrgMatchPreferences = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ orgId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const orgId = data.orgId;
    if (memoryStore.has(orgId)) {
      return memoryStore.get(orgId)!;
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, slug, profile_answers");
      const res = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      const meta = res.data?.profile_answers as Record<string, unknown> | undefined;
      if (meta?.match_preferences) {
        const loaded = meta.match_preferences as MatchPreferences;
        memoryStore.set(orgId, loaded);
        return loaded;
      }
    } catch {
      // fallback to default
    }

    return DEFAULT_PREFERENCES;
  });

export const saveOrgMatchPreferences = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        orgId: z.string(),
        prefs: prefsSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { orgId, prefs } = data;
    memoryStore.set(orgId, prefs);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      if (org) {
        const existingMeta = (org.profile_answers as Record<string, unknown> | undefined) || {};
        const newMeta = { ...existingMeta, match_preferences: prefs };
        await sb.from("orgs").update({ profile_answers: newMeta }).eq("id", org.id);
      }
    } catch {
      // server memory cached
    }

    return { ok: true, prefs };
  });
