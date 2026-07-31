import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ConversationSummary, RawMessage } from "@/lib/comms-types";
import { STARTER_THREADS, starterAuthor, daysAgoIso } from "@/lib/comms.server";

export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<ConversationSummary[]> => {
    const { supabase } = context;

    const { data: mine, error: mineErr } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("org_id", data.orgId);
    if (mineErr) throw new Error(mineErr.message);
    if (!mine || mine.length === 0) return [];

    const ids = mine.map((r) => r.conversation_id);
    const readAt = new Map(mine.map((r) => [r.conversation_id, r.last_read_at]));

    const [{ data: parts }, { data: msgs }] = await Promise.all([
      supabase
        .from("conversation_participants")
        .select("conversation_id, org_id")
        .in("conversation_id", ids),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_org_id, body, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true }),
    ]);

    const counterpart = new Map<string, string>();
    for (const p of parts ?? []) {
      if (p.org_id !== data.orgId) counterpart.set(p.conversation_id, p.org_id);
    }

    const acc = new Map<string, ConversationSummary>();
    for (const id of ids) {
      const other = counterpart.get(id);
      if (!other) continue;
      acc.set(id, {
        id,
        counterpartOrgId: other,
        lastMessageAt: readAt.get(id) ?? new Date(0).toISOString(),
        unread: 0,
        lastBody: null,
        lastFromMe: false,
      });
    }

    for (const m of msgs ?? []) {
      const c = acc.get(m.conversation_id);
      if (!c) continue;
      c.lastBody = m.body;
      c.lastFromMe = m.sender_org_id === data.orgId;
      c.lastMessageAt = m.created_at;
      const seenAt = readAt.get(m.conversation_id) ?? new Date(0).toISOString();
      if (m.sender_org_id !== data.orgId && m.created_at > seenAt) c.unread += 1;
    }

    return Array.from(acc.values()).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<RawMessage[]> => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, conversation_id, sender_org_id, author_name, author_role, body, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const ensureConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ myOrgId: z.string().uuid(), counterpartOrgId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("get_or_create_conversation", {
      _org_a: data.myOrgId,
      _org_b: data.counterpartOrgId,
    });
    if (error) throw new Error(error.message);
    return { conversationId: id as string };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        myOrgId: z.string().uuid(),
        counterpartOrgId: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: conversationId, error: convErr } = await supabase.rpc(
      "get_or_create_conversation",
      { _org_a: data.myOrgId, _org_b: data.counterpartOrgId },
    );
    if (convErr) throw new Error(convErr.message);

    const { data: member } = await supabase
      .from("org_members")
      .select("display_name, title, role")
      .eq("org_id", data.myOrgId)
      .eq("user_id", userId)
      .maybeSingle();

    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId as string,
        sender_org_id: data.myOrgId,
        sender_user_id: userId,
        author_name: member?.display_name ?? "You",
        author_role: member?.title ?? member?.role ?? "Member",
        body: data.body,
      })
      .select("id, conversation_id, sender_org_id, author_name, author_role, body, created_at")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("conversations")
      .update({ last_message_at: row.created_at })
      .eq("id", conversationId as string);
    await supabase
      .from("conversation_participants")
      .update({ last_read_at: row.created_at })
      .eq("conversation_id", conversationId as string)
      .eq("org_id", data.myOrgId);

    return row as RawMessage;
  });

export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ conversationId: z.string().uuid(), orgId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", data.conversationId)
      .eq("org_id", data.orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * First-run demo continuity: if an organization has no conversations yet, open a
 * handful of threads with well-profiled partner organizations so the inbox is
 * not empty. Everything created here is a real database row.
 */
export const ensureStarterConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isMember } = await supabase.rpc("is_org_member", {
      _user: userId,
      _org: data.orgId,
    });
    if (!isMember) return { created: 0 };

    const { count } = await supabase
      .from("conversation_participants")
      .select("id", { count: "exact", head: true })
      .eq("org_id", data.orgId);
    if ((count ?? 0) > 0) return { created: 0 };

    const { data: partners } = await supabase
      .from("orgs")
      .select("id, name")
      .neq("id", data.orgId)
      .not("legacy_id", "is", null)
      .order("profile_completeness", { ascending: false })
      .limit(5);
    if (!partners || partners.length === 0) return { created: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let created = 0;
    for (let i = 0; i < partners.length; i++) {
      const p = partners[i];
      const { data: conversationId, error } = await supabase.rpc("get_or_create_conversation", {
        _org_a: data.orgId,
        _org_b: p.id,
      });
      if (error || !conversationId) continue;

      const script = STARTER_THREADS[i % STARTER_THREADS.length];
      const author = starterAuthor(p.name);
      const rows = script.lines.map((body, j) => ({
        conversation_id: conversationId as string,
        sender_org_id: p.id,
        sender_user_id: null,
        author_name: author.name,
        author_role: author.role,
        body,
        created_at: daysAgoIso(i + 1, (script.lines.length - 1 - j) * 3),
      }));
      await supabaseAdmin.from("messages").insert(rows);
      await supabaseAdmin
        .from("conversations")
        .update({ last_message_at: rows[rows.length - 1].created_at })
        .eq("id", conversationId as string);
      created += 1;
    }

    return { created };
  });
