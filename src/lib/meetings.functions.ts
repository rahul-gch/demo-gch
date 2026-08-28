import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { MeetingRequest, MeetingStatus } from "@/lib/comms-types";
import { toMeetingRequest, DB_STATUSES } from "@/lib/meetings.server";

export const listMeetings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<MeetingRequest[]> => {
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
        /** Org the caller is acting as; required for withdraw. */
        actingOrgId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error: readErr } = await context.supabase
      .from("meeting_requests")
      .select("id, status, requester_org_id, recipient_org_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Meeting request not found");
    if (row.status !== "pending") throw new Error("This request has already been answered");

    if (data.status === "cancelled") {
      if (!data.actingOrgId || data.actingOrgId !== row.requester_org_id) {
        throw new Error("Only the organization that sent the request can withdraw it");
      }
    } else if (data.actingOrgId && data.actingOrgId !== row.recipient_org_id) {
      throw new Error("Only the invited organization can answer this request");
    }

    const { error } = await context.supabase
      .from("meeting_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true } as { ok: true; status?: MeetingStatus };
  });
