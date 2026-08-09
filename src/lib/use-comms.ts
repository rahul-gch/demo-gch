import { useEffect, useId, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { myOrgMemberships } from "@/lib/orgs.functions";

import {
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
import { fallbackEntity } from "@/lib/entity-fallback";

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

/** Memberships with display names, for the acting-organization switcher. */
export function useMyOrgs() {
  const { data } = useQuery({
    queryKey: ["my-org-memberships"],
    queryFn: () => myOrgMemberships(),
    staleTime: 5 * 60_000,
  });
  return useMemo(
    () => (data ?? []).map((m) => ({ id: m.org_id as string, name: m.org_name as string })),
    [data],
  );
}

export function useActingOrgId(preferred?: string | null): string | null {
  const ids = useMyOrgIds();
  if (preferred && ids.includes(preferred)) return preferred;
  return ids[0] ?? null;
}

export interface ConversationView extends ConversationSummary {
  entity: NonNullable<ReturnType<typeof getEntity>>;
}

export function useConversations(orgId: string | null) {
  const queryClient = useQueryClient();
  const instanceId = useId();

  const query = useQuery({
    queryKey: ["conversations", orgId],
    enabled: !!orgId,
    queryFn: () => listConversations({ data: { orgId: orgId! } }),
  });

  // Live delivery: any new message refreshes the list and the open thread.
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`messages-${orgId}-${instanceId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const convId = (payload.new as { conversation_id?: string })?.conversation_id;
        queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
        if (convId) queryClient.invalidateQueries({ queryKey: ["thread", convId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient, instanceId]);

  const conversations = useMemo<ConversationView[]>(
    () =>
      (query.data ?? [])
        .map((c) => {
          const known = getEntity(c.counterpartOrgId);
          const entity = known ?? (c.counterpart ? fallbackEntity(c.counterpart) : null);
          return entity ? { ...c, entity } : null;
        })
        .filter((c): c is ConversationView => c !== null),
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
      queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
    },
  });
}

// ---------------- meetings ----------------

export function useMeetings(orgId: string | null) {
  const queryClient = useQueryClient();
  const instanceId = useId();

  const query = useQuery({
    queryKey: ["meetings", orgId],
    enabled: !!orgId,
    queryFn: () => listMeetings({ data: { orgId: orgId! } }),
  });

  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`meetings-${orgId}-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_requests" }, () => {
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient, instanceId]);

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

export function useSetMeetingStatus(actingOrgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: "confirmed" | "declined" | "cancelled" }) =>
      setMeetingStatus({ data: { ...vars, actingOrgId: actingOrgId ?? undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", actingOrgId] });
    },
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

/**
 * Mounted once per shell: keeps message + meeting caches fresh app-wide and
 * surfaces a toast for incoming activity while the user is on another page.
 */
export function useRealtimeComms(orgId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`comms-shell-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as { conversation_id?: string; sender_org_id?: string; author_name?: string; body?: string };
          queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
          queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
          if (row.conversation_id)
            queryClient.invalidateQueries({ queryKey: ["thread", row.conversation_id] });
          if (row.sender_org_id && row.sender_org_id !== orgId) {
            toast.message(`New message from ${row.author_name ?? "a partner"}`, {
              description: row.body?.slice(0, 100),
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meeting_requests" },
        (payload) => {
          const row = payload.new as { recipient_org_id?: string };
          queryClient.invalidateQueries({ queryKey: ["meetings"] });
          queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
          if (row.recipient_org_id === orgId) toast.message("New meeting request received");
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "meeting_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["meetings"] });
          queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);
}

