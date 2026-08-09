import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  listNotifications,
  markAllNotificationsRead,
  orgSharedCounts,
  type NotificationItem,
  type SharedCounts,
} from "@/lib/notifications.functions";

export type { NotificationItem, SharedCounts };

export function useNotifications(orgId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", orgId],
    enabled: !!orgId,
    queryFn: () => listNotifications({ data: { orgId: orgId! } }),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!orgId) return;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
    const channel = supabase
      .channel(`notifications-${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, invalidate)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meeting_requests" },
        invalidate,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);


  return { items: query.data ?? [], isLoading: query.isLoading };
}

export function useMarkAllNotificationsRead(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead({ data: { orgId: orgId! } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", orgId] });
    },
  });
}

export function useSharedCounts(orgId: string | null, counterpartOrgId: string | null) {
  const query = useQuery({
    queryKey: ["shared-counts", orgId, counterpartOrgId],
    enabled: !!orgId && !!counterpartOrgId,
    queryFn: () =>
      orgSharedCounts({ data: { orgId: orgId!, counterpartOrgId: counterpartOrgId! } }),
    staleTime: 60_000,
  });
  return query.data ?? null;
}
