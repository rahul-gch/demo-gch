import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { myOrgMemberships } from "@/lib/orgs.functions";
import {
  ensureStarterConversations,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/messaging.functions";
import {
  createMeetingRequest,
  listMeetings,
  setMeetingStatus,
} from "@/lib/meetings.functions";
import type { ConversationSummary, MeetingRequest, ThreadMessage } from "@/lib/comms-types";
import { getEntity } from "@/seed/all-entities";

export type { ThreadMessage, MeetingRequest } from "@/lib/comms-types";

/** The organization the signed-in user is acting as (their first membership). */
export function useMyOrgIds() {
  const { data } = useQuery({
    queryKey: ["my-org-memberships"],
    queryFn: () => myOrgMemberships(),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => (data ?? []).map((m) => m.org_id as string), [data]);
}

export function useActingOrgId(preferred?: string | null): string | null {
  const ids = useMyOrgIds();
  if (preferred && ids.includes(preferred)) return preferred;
  return ids[0] ?? null;
}

export interface ConversationView extends ConversationSummary {
  entity: ReturnType<typeof getEntity>;
}

export function useConversations(orgId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const first = await listConversations({ data: { orgId: orgId! } });
      if (first.length > 0) return first;
      const seeded = await ensureStarterConversations({ data: { orgId: orgId! } });
      if (seeded.created > 0) return listConversations({ data: { orgId: orgId! } });
      return first;
    },
  });

  // Live delivery: any new message refreshes the list and the open thread.
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`messages-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const convId = (payload.new as { conversation_id?: string })?.conversation_id;
        queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
        if (convId) queryClient.invalidateQueries({ queryKey: ["thread", convId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);

  const conversations = useMemo<ConversationView[]>(
    () =>
      (query.data ?? [])
        .map((c) => ({ ...c, entity: getEntity(c.counterpartOrgId) }))
        .filter((c) => !!c.entity),
    [query.data],
  );

  return { conversations, isLoading: query.isLoading };
}

export function useThread(conversationId: string | null, myOrgId: string | null) {
  const query = useQuery({
    queryKey: ["thread", conversationId],
    enabled: !!conversationId,
    queryFn: () => listMessages({ data: { conversationId: conversationId! } }),
  });

  const messages = useMemo<ThreadMessage[]>(
    () =>
      (query.data ?? []).map((m) => ({
        id: m.id,
        from: m.sender_org_id === myOrgId ? "me" : "them",
        authorName: m.author_name,
        authorRole: m.author_role ?? "",
        body: m.body,
        at: m.created_at,
        read: true,
      })),
    [query.data, myOrgId],
  );

  return { messages, isLoading: query.isLoading };
}

export function useMarkRead(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      markConversationRead({ data: { conversationId, orgId: orgId! } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", orgId] }),
  });
}

export function useSendMessage(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { counterpartOrgId: string; body: string }) =>
      sendMessage({ data: { myOrgId: orgId!, ...vars } }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
      queryClient.invalidateQueries({ queryKey: ["thread", row.conversation_id] });
    },
  });
}

// ---------------- meetings ----------------

export function useMeetings(orgId: string | null) {
  const query = useQuery({
    queryKey: ["meetings", orgId],
    enabled: !!orgId,
    queryFn: () => listMeetings({ data: { orgId: orgId! } }),
  });
  return { meetings: (query.data ?? []) as MeetingRequest[], isLoading: query.isLoading };
}

export function useCreateMeeting(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      recipientOrgId: string;
      proposedFor: string;
      durationMin: number;
      agenda: string;
    }) => createMeetingRequest({ data: { requesterOrgId: orgId!, ...vars } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useSetMeetingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: "confirmed" | "declined" | "cancelled" }) =>
      setMeetingStatus({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUnreadTotal(orgId: string | null) {
  const { conversations } = useConversations(orgId);
  return conversations.reduce((n, c) => n + c.unread, 0);
}

export function usePendingMeetingCount(orgId: string | null) {
  const { meetings } = useMeetings(orgId);
  return meetings.filter((m) => m.status === "Pending").length;
}
