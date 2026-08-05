import { supabase } from "@/integrations/supabase/client";

/**
 * Append-only security activity log.
 *
 * NEVER pass passwords, tokens, session data, file contents or other sensitive
 * private values into `detail` — only non-sensitive metadata (ids, field names,
 * role names, counts).
 */
export type SecurityAction =
  | "auth.sign_in"
  | "auth.sign_up"
  | "auth.sign_out"
  | "auth.password_reset_requested"
  | "auth.password_changed"
  | "org.created"
  | "org.updated"
  | "org.profile_answers_updated"
  | "org.member_role_changed"
  | "org.member_removed"
  | "org.invite_created"
  | "org.invite_revoked"
  | "document.uploaded"
  | "document.downloaded"
  | "document.deleted"
  | "privacy.consent_recorded"
  | "privacy.data_export_requested"
  | "privacy.data_deletion_requested"
  | "admin.action";

const SENSITIVE_KEY = /(pass|token|secret|key|auth|session|credential)/i;

function scrub(detail: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (SENSITIVE_KEY.test(k)) continue;
    if (typeof v === "string" && v.length > 300) continue;
    out[k] = v;
  }
  return out;
}

/** Fire-and-forget; logging must never block or break a user flow. */
export async function logSecurityEvent(
  action: SecurityAction,
  opts: {
    orgId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    detail?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    await supabase.from("security_events").insert({
      user_id: userId,
      org_id: opts.orgId ?? null,
      action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      detail: scrub(opts.detail ?? {}),
    });
  } catch {
    /* logging is best-effort */
  }
}
