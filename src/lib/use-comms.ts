import { useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { myOrgMemberships } from "@/lib/orgs.functions";

import {
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/messaging.functions";
import { createMeetingRequest, listMeetings, setMeetingStatus } from "@/lib/meetings.functions";
import type { ConversationSummary, MeetingRequest, ThreadMessage } from "@/lib/comms-types";
import { getEntity } from "@/seed/all-entities";
import { fallbackEntity } from "@/lib/entity-fallback";

export type { ThreadMessage, MeetingRequest } from "@/lib/comms-types";

/**
 * Protected communication queries can mount while the browser auth client is
 * still restoring its session. Wait for that restoration before invoking a
 * server function so its global middleware always has a bearer token to send.
 */
export function useAuthenticatedSessionReady() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(Boolean(data.session?.access_token));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setHasSession(Boolean(session?.access_token));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return hasSession;
}

/**
 * Last-moment guard for query functions: the session can disappear (expiry,
 * sign-out in another tab) between the `enabled` check and the actual call.
 * Returns `fallback` instead of hitting the server without a bearer token.
 */
export async function withSession<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) return fallback;
  return run();
}

/** The organization the signed-in user is acting as (their first membership). */
export function useMyOrgIds() {
  const hasSession = useAuthenticatedSessionReady();
  const getMemberships = useServerFn(myOrgMemberships);
  const { data } = useQuery({
    queryKey: ["my-org-memberships"],
    queryFn: () => getMemberships(),
    enabled: hasSession,
    staleTime: 5 * 60_000,
  });
  return useMemo(() => (data ?? []).map((m) => m.org_id as string), [data]);
}

/** Memberships with display names, for the acting-organization switcher. */
export function useMyOrgs() {
  const hasSession = useAuthenticatedSessionReady();
  const getMemberships = useServerFn(myOrgMemberships);
  const { data } = useQuery({
    queryKey: ["my-org-memberships"],
    queryFn: () => getMemberships(),
    enabled: hasSession,
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

/**
 * Organization-scoped pages must always speak for the organization in the URL —
 * never silently fall back to one of the viewer's own organizations. Returns the
 * requested org plus whether the viewer actually belongs to it.
 */
export function useViewedOrg(orgUuid?: string | null): {
  orgId: string | null;
  isMember: boolean;
} {
  const ids = useMyOrgIds();
  return {
    orgId: orgUuid ?? null,
    isMember: Boolean(orgUuid && ids.includes(orgUuid)),
  };
}

export interface ConversationView extends ConversationSummary {
  entity: NonNullable<ReturnType<typeof getEntity>>;
}

export function useConversations(orgId: string | null) {
  const queryClient = useQueryClient();
  const instanceId = useId();
  const hasSession = useAuthenticatedSessionReady();
  const getConversations = useServerFn(listConversations);

  const query = useQuery({
    queryKey: ["conversations", orgId],
    enabled: !!orgId && hasSession,
    queryFn: () => {
      if (!orgId) return [];
      return getConversations({ data: { orgId } });
    },
  });

  // Live delivery: any new message refreshes the list and the open thread.
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`messages-${orgId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const convId = (payload.new as { conversation_id?: string })?.conversation_id;
          queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
          if (convId) queryClient.invalidateQueries({ queryKey: ["thread", convId] });
        },
      )
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
  const hasSession = useAuthenticatedSessionReady();
  const getMessages = useServerFn(listMessages);
  const query = useQuery({
    queryKey: ["thread", conversationId],
    enabled: !!conversationId && hasSession,
    queryFn: () => {
      if (!conversationId) return [];
      return getMessages({ data: { conversationId } });
    },
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
  const markRead = useServerFn(markConversationRead);
  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!orgId) throw new Error("No organization selected.");
      return markRead({ data: { conversationId, orgId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations", orgId] }),
  });
}

export function useSendMessage(orgId: string | null) {
  const queryClient = useQueryClient();
  const send = useServerFn(sendMessage);
  return useMutation({
    mutationFn: (vars: { counterpartOrgId: string; body: string }) => {
      if (!orgId) throw new Error("No organization selected.");
      return send({ data: { myOrgId: orgId, ...vars } });
    },
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
  const hasSession = useAuthenticatedSessionReady();
  const getMeetings = useServerFn(listMeetings);

  const query = useQuery({
    queryKey: ["meetings", orgId],
    enabled: !!orgId && hasSession,
    queryFn: () => {
      if (!orgId) return [];
      return getMeetings({ data: { orgId } });
    },
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
  const createMeeting = useServerFn(createMeetingRequest);
  return useMutation({
    mutationFn: (vars: {
      recipientOrgId: string;
      proposedFor: string;
      durationMin: number;
      agenda: string;
    }) => {
      if (!orgId) throw new Error("No organization selected.");
      return createMeeting({ data: { requesterOrgId: orgId, ...vars } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useSetMeetingStatus(actingOrgId?: string | null) {
  const queryClient = useQueryClient();
  const updateMeetingStatus = useServerFn(setMeetingStatus);
  return useMutation({
    mutationFn: (vars: { id: string; status: "confirmed" | "declined" | "cancelled" }) =>
      updateMeetingStatus({ data: { ...vars, actingOrgId: actingOrgId ?? undefined } }),
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
          const row = payload.new as {
            conversation_id?: string;
            sender_org_id?: string;
            body?: string;
          };
          queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
          queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
          if (row.conversation_id)
            queryClient.invalidateQueries({ queryKey: ["thread", row.conversation_id] });
          if (row.sender_org_id && row.sender_org_id !== orgId) {
            toast.message("New message from a partner organization", {
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
