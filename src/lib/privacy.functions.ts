import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Assembles a machine-readable copy of everything the platform stores about the
 * signed-in user. Runs with the user's own token, so RLS guarantees no other
 * user's or organization's private data can leak into the export.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;

    const [memberships, consents, requests, messages, meetings, events] = await Promise.all([
      supabase
        .from("org_members")
        .select("org_id, role, display_name, title, joined_at")
        .eq("user_id", userId),
      supabase
        .from("user_consents")
        .select("policy_type, policy_version, accepted, accepted_at")
        .eq("user_id", userId),
      supabase
        .from("data_requests")
        .select("request_type, status, note, created_at")
        .eq("user_id", userId),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_org_id, body, created_at")
        .eq("sender_user_id", userId)
        .limit(1000),
      supabase
        .from("meeting_requests")
        .select("id, requester_org_id, recipient_org_id, proposed_for, agenda, status, created_at")
        .eq("requested_by", userId)
        .limit(1000),
      supabase
        .from("security_events")
        .select("action, target_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const orgIds = (memberships.data ?? []).map((m) => m.org_id as string);
    const orgs = orgIds.length
      ? ((await supabase.from("orgs").select("*").in("id", orgIds)).data ?? [])
      : [];

    return {
      generated_at: new Date().toISOString(),
      account: {
        user_id: userId,
        email: (claims as { email?: string } | undefined)?.email ?? null,
        metadata: (claims as { user_metadata?: unknown } | undefined)?.user_metadata ?? null,
      },
      consents: consents.data ?? [],
      data_requests: requests.data ?? [],
      memberships: memberships.data ?? [],
      organizations: orgs,
      messages_sent: messages.data ?? [],
      meeting_requests: meetings.data ?? [],
      security_activity: events.data ?? [],
    };
  });

/**
 * Records a data export or deletion request. The request is queued for a
 * platform admin — deletions are never executed silently.
 */
export const submitDataRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        requestType: z.enum(["export", "deletion"]),
        note: z.string().trim().max(1000).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: open } = await supabase
      .from("data_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("request_type", data.requestType)
      .in("status", ["pending", "in_progress"])
      .maybeSingle();
    if (open) {
      return { ok: true, alreadyOpen: true as const };
    }

    const { error } = await supabase.from("data_requests").insert({
      user_id: userId,
      request_type: data.requestType,
      note: data.note || null,
    });
    if (error) throw new Error(error.message);

    await supabase.from("security_events").insert({
      user_id: userId,
      action:
        data.requestType === "export"
          ? "privacy.data_export_requested"
          : "privacy.data_deletion_requested",
      target_type: "account",
      target_id: userId,
    });

    return { ok: true, alreadyOpen: false as const };
  });
