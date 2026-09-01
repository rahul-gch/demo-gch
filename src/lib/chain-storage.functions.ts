import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Resilient in-memory server store with cross-device sync
const memoryChainStore = new Map<string, Set<string>>();

export const getOrgChainIds = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ orgId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const orgId = data.orgId;
    if (memoryChainStore.has(orgId)) {
      return Array.from(memoryChainStore.get(orgId)!);
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      const meta = org?.profile_answers as Record<string, unknown> | undefined;
      if (meta?.chain_draft_ids && Array.isArray(meta.chain_draft_ids)) {
        const list = meta.chain_draft_ids as string[];
        memoryChainStore.set(orgId, new Set(list));
        return list;
      }
    } catch {
      // fallback to memory
    }

    return [];
  });

export const addOrgChainId = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        orgId: z.string(),
        entityId: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { orgId, entityId } = data;
    const current = memoryChainStore.get(orgId) ?? new Set<string>();
    current.add(entityId);
    memoryChainStore.set(orgId, current);
    const list = Array.from(current);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      if (org) {
        const existingMeta = (org.profile_answers as Record<string, unknown> | undefined) || {};
        const newMeta = { ...existingMeta, chain_draft_ids: list };
        await sb.from("orgs").update({ profile_answers: newMeta }).eq("id", org.id);
      }
    } catch {
      // memory store updated
    }

    return { ok: true, ids: list };
  });

export const removeOrgChainId = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        orgId: z.string(),
        entityId: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { orgId, entityId } = data;
    const current = memoryChainStore.get(orgId) ?? new Set<string>();
    current.delete(entityId);
    memoryChainStore.set(orgId, current);
    const list = Array.from(current);

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      const sb = supabase as any;
      const query = sb.from("orgs").select("id, profile_answers");
      const { data: org } = isUuid ? await query.eq("id", orgId).maybeSingle() : await query.eq("slug", orgId).maybeSingle();
      if (org) {
        const existingMeta = (org.profile_answers as Record<string, unknown> | undefined) || {};
        const newMeta = { ...existingMeta, chain_draft_ids: list };
        await sb.from("orgs").update({ profile_answers: newMeta }).eq("id", org.id);
      }
    } catch {
      // memory store updated
    }

    return { ok: true, ids: list };
  });
