import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ConnectionRecord {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Accepts an organization UUID, a legacy seed id, or a slug and resolves it to
 * the database UUID. Returns null when nothing matches.
 */
async function resolveOrgUuid(
  supabase: SupabaseClient,
  id: string,
): Promise<string | null> {
  if (UUID_RE.test(id)) return id;
  const { data } = await supabase
    .from("orgs")
    .select("id")
    .or(`legacy_id.eq.${id},slug.eq.${id}`)
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export const getOrgConnections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orgId: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }): Promise<ConnectionRecord[]> => {
    const { supabase } = context;
    const orgUuid = await resolveOrgUuid(supabase, data.orgId);
    if (!orgUuid) return [];

    const { data: rows, error } = await supabase
      .from("org_connections")
      .select("id, from_org_id, to_org_id, status, created_at")
      .or(`from_org_id.eq.${orgUuid},to_org_id.eq.${orgUuid}`);
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r) => ({
      id: r.id as string,
      fromOrgId: r.from_org_id as string,
      toOrgId: r.to_org_id as string,
      status: r.status as ConnectionRecord["status"],
      createdAt: r.created_at as string,
    }));
  });

export const sendOrgConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ fromOrgId: z.string().min(1), toOrgId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<ConnectionRecord> => {
    const { supabase, userId } = context;
    const fromUuid = await resolveOrgUuid(supabase, data.fromOrgId);
    const toUuid = await resolveOrgUuid(supabase, data.toOrgId);
    if (!fromUuid || !toUuid) throw new Error("Organization not found");
    if (fromUuid === toUuid) throw new Error("Cannot connect an organization to itself");

    // Reuse an existing record in either direction so a pair never duplicates.
    const { data: existing } = await supabase
      .from("org_connections")
      .select("id, from_org_id, to_org_id, status, created_at")
      .or(
        `and(from_org_id.eq.${fromUuid},to_org_id.eq.${toUuid}),and(from_org_id.eq.${toUuid},to_org_id.eq.${fromUuid})`,
      )
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted" || existing.status === "pending") {
        return {
          id: existing.id as string,
          fromOrgId: existing.from_org_id as string,
          toOrgId: existing.to_org_id as string,
          status: existing.status as ConnectionRecord["status"],
          createdAt: existing.created_at as string,
        };
      }
      // Declined requests can be re-sent from this org.
      const { data: revived, error: revErr } = await supabase
        .from("org_connections")
        .update({ status: "pending", requested_by: userId, responded_by: null, responded_at: null })
        .eq("id", existing.id as string)
        .select("id, from_org_id, to_org_id, status, created_at")
        .single();
      if (revErr) throw new Error(revErr.message);
      return {
        id: revived.id as string,
        fromOrgId: revived.from_org_id as string,
        toOrgId: revived.to_org_id as string,
        status: revived.status as ConnectionRecord["status"],
        createdAt: revived.created_at as string,
      };
    }

    const { data: inserted, error } = await supabase
      .from("org_connections")
      .insert({
        from_org_id: fromUuid,
        to_org_id: toUuid,
        status: "pending",
        requested_by: userId,
      })
      .select("id, from_org_id, to_org_id, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    return {
      id: inserted.id as string,
      fromOrgId: inserted.from_org_id as string,
      toOrgId: inserted.to_org_id as string,
      status: inserted.status as ConnectionRecord["status"],
      createdAt: inserted.created_at as string,
    };
  });

export const respondOrgConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        myOrgId: z.string().min(1),
        otherOrgId: z.string().min(1),
        status: z.enum(["accepted", "declined"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ success: boolean }> => {
    const { supabase, userId } = context;
    const myUuid = await resolveOrgUuid(supabase, data.myOrgId);
    const otherUuid = await resolveOrgUuid(supabase, data.otherOrgId);
    if (!myUuid || !otherUuid) throw new Error("Organization not found");

    // Only the recipient organization may accept or decline a pending request.
    const { data: row } = await supabase
      .from("org_connections")
      .select("id")
      .eq("from_org_id", otherUuid)
      .eq("to_org_id", myUuid)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();
    if (!row) throw new Error("No pending request to respond to");

    const { error } = await supabase
      .from("org_connections")
      .update({ status: data.status, responded_by: userId, responded_at: new Date().toISOString() })
      .eq("id", row.id as string);
    if (error) throw new Error(error.message);

    return { success: true };
  });
