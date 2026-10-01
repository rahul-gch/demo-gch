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

export const getOrgChainIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data, context }): Promise<string[]> => {
    const orgId = await resolveOrgUuid(context.supabase, data.orgId);
    if (!orgId) return [];

    await assertOrgMemberOrAdmin(context.supabase, context.userId, orgId);
    const answers = await readProfileAnswers(context.supabase, orgId);
    const list = answers?.chain_draft_ids;
    return Array.isArray(list) ? (list as string[]) : [];
  });

export const addOrgChainId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orgId: z.string().min(1).max(200),
        entityId: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const orgId = await resolveOrgUuid(context.supabase, data.orgId);
    if (!orgId) throw new Error("Organization not found");

    await assertOrgEditor(context.supabase, context.userId, orgId);
    const answers = await readProfileAnswers(context.supabase, orgId);
    const currentList = Array.isArray(answers?.chain_draft_ids)
      ? (answers.chain_draft_ids as string[])
      : [];

    const set = new Set(currentList);
    set.add(data.entityId);
    const updatedList = Array.from(set);

    await writeProfileAnswers(context.supabase, orgId, {
      ...answers,
      chain_draft_ids: updatedList,
    });

    return { ok: true, ids: updatedList };
  });

export const removeOrgChainId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orgId: z.string().min(1).max(200),
        entityId: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const orgId = await resolveOrgUuid(context.supabase, data.orgId);
    if (!orgId) throw new Error("Organization not found");

    await assertOrgEditor(context.supabase, context.userId, orgId);
    const answers = await readProfileAnswers(context.supabase, orgId);
    const currentList = Array.isArray(answers?.chain_draft_ids)
      ? (answers.chain_draft_ids as string[])
      : [];

    const set = new Set(currentList);
    set.delete(data.entityId);
    const updatedList = Array.from(set);

    await writeProfileAnswers(context.supabase, orgId, {
      ...answers,
      chain_draft_ids: updatedList,
    });

    return { ok: true, ids: updatedList };
  });
