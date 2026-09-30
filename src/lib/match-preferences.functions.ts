import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertOrgEditor,
  assertOrgMemberOrAdmin,
  readProfileAnswers,
  resolveOrgUuid,
  writeProfileAnswers,
} from "./org-access.server";
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

export const getOrgMatchPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data, context }): Promise<MatchPreferences> => {
    const orgId = await resolveOrgUuid(context.supabase, data.orgId);
    if (!orgId) return DEFAULT_PREFERENCES;
    await assertOrgMemberOrAdmin(context.supabase, context.userId, orgId);
    const answers = await readProfileAnswers(context.supabase, orgId);
    return (answers.match_preferences as MatchPreferences | undefined) ?? DEFAULT_PREFERENCES;
  });

export const saveOrgMatchPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ orgId: z.string().min(1).max(200), prefs: prefsSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const orgId = await resolveOrgUuid(context.supabase, data.orgId);
    if (!orgId) throw new Error("Organization not found");
    await assertOrgEditor(context.supabase, context.userId, orgId);
    const answers = await readProfileAnswers(context.supabase, orgId);
    await writeProfileAnswers(context.supabase, orgId, { ...answers, match_preferences: data.prefs });
    return { ok: true, prefs: data.prefs };
  });
