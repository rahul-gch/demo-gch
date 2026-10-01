import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { MeetingRequest, MeetingStatus } from "@/lib/comms-types";
import { toMeetingRequest, DB_STATUSES } from "@/lib/meetings.server";

export const listMeetings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<MeetingRequest[]> => {
    // Defense-in-depth: caller must be a member of the requested org or a platform admin
    const [{ data: isMember }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("is_org_member", { _user: context.userId, _org: data.orgId }),
      context.supabase.rpc("is_platform_admin", { _user: context.userId }),
    ]);
    if (!isMember && !isAdmin) {
      throw new Error("Forbidden: you are not a member of this organization.");
    }

    const { data: rows, error } = await context.supabase
      .from("meeting_requests")
      .select(
        "id, requester_org_id, recipient_org_id, proposed_for, duration_min, agenda, status, created_at, requester:orgs!meeting_requests_requester_org_id_fkey(name), recipient:orgs!meeting_requests_recipient_org_id_fkey(name)",
      )
      .or(`requester_org_id.eq.${data.orgId},recipient_org_id.eq.${data.orgId}`)
      .order("proposed_for", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => toMeetingRequest(r as never, data.orgId));
  });

export const createMeetingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        requesterOrgId: z.string().uuid(),
        recipientOrgId: z.string().uuid(),
        proposedFor: z.string().min(4),
        durationMin: z.number().int().min(15).max(480),
        agenda: z.string().trim().max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // H3: Verify caller actually belongs to requesterOrgId (prevents spoofing)
    const [{ data: isMember }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("is_org_member", { _user: context.userId, _org: data.requesterOrgId }),
      context.supabase.rpc("is_platform_admin", { _user: context.userId }),
    ]);
    if (!isMember && !isAdmin) {
      throw new Error("Forbidden: you are not a member of the requesting organization.");
    }

    const { error } = await context.supabase.from("meeting_requests").insert({
      requester_org_id: data.requesterOrgId,
      recipient_org_id: data.recipientOrgId,
      requested_by: context.userId,
      proposed_for: data.proposedFor,
      duration_min: data.durationMin,
      agenda: data.agenda,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setMeetingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(DB_STATUSES),
        /** H2: actingOrgId is strictly required (prevents recipient auth bypass) */
        actingOrgId: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // H2: Verify caller belongs to the acting organization
    const [{ data: isMember }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("is_org_member", { _user: context.userId, _org: data.actingOrgId }),
      context.supabase.rpc("is_platform_admin", { _user: context.userId }),
    ]);
    if (!isMember && !isAdmin) {
      throw new Error("Forbidden: you are not a member of the acting organization.");
    }

    const { data: row, error: readErr } = await context.supabase
      .from("meeting_requests")
      .select("id, status, requester_org_id, recipient_org_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Meeting request not found");
    if (row.status !== "pending") throw new Error("This request has already been answered");

    // H2: Enforce that only requester can cancel, and only recipient can confirm/decline
    if (data.status === "cancelled") {
      if (data.actingOrgId !== row.requester_org_id && !isAdmin) {
        throw new Error("Only the organization that sent the request can withdraw it");
      }
    } else {
      if (data.actingOrgId !== row.recipient_org_id && !isAdmin) {
        throw new Error("Only the invited organization can answer this request");
      }
    }

    const { error } = await context.supabase
      .from("meeting_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true } as { ok: true; status?: MeetingStatus };
  });
