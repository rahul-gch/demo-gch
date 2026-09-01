import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Entity } from "@/seed/types";
import { ALL_ENTITIES, getEntity } from "@/seed/all-entities";
import {
  getOrgConnections,
  sendOrgConnection,
  respondOrgConnection,
  type ConnectionRecord,
} from "./connections.functions";

function canonicalId(id: string): string {
  if (!id) return id;
  const e = getEntity(id) || ALL_ENTITIES.find((item) => item.id === id || item.orgUuid === id || item.slug === id);
  return e?.id ?? id;
}

function matchesOrg(recordOrgId: string, queryOrgId: string): boolean {
  if (!recordOrgId || !queryOrgId) return false;
  if (recordOrgId.toLowerCase() === queryOrgId.toLowerCase()) return true;

  const e1 = getEntity(recordOrgId) || ALL_ENTITIES.find((e) => e.id === recordOrgId || e.orgUuid === recordOrgId);
  const e2 = getEntity(queryOrgId) || ALL_ENTITIES.find((e) => e.id === queryOrgId || e.orgUuid === queryOrgId);

  if (e1 && e2) {
    return e1.id === e2.id || (!!e1.orgUuid && e1.orgUuid === e2.orgUuid);
  }
  if (e1) {
    return (
      e1.id.toLowerCase() === queryOrgId.toLowerCase() ||
      e1.slug?.toLowerCase() === queryOrgId.toLowerCase() ||
      e1.orgUuid?.toLowerCase() === queryOrgId.toLowerCase()
    );
  }
  if (e2) {
    return (
      e2.id.toLowerCase() === recordOrgId.toLowerCase() ||
      e2.slug?.toLowerCase() === recordOrgId.toLowerCase() ||
      e2.orgUuid?.toLowerCase() === recordOrgId.toLowerCase()
    );
  }
  return false;
}

/** Pure React Query Hook for Organization Connections (Zero LocalStorage) */
export function useOrgConnections(orgId: string | null | undefined) {
  const normOrgId = orgId ? canonicalId(orgId) : null;

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ["org-connections", normOrgId],
    enabled: !!normOrgId,
    queryFn: () => getOrgConnections({ data: { orgId: normOrgId! } }),
    staleTime: 10_000,
    refetchInterval: 15_000, // Background poll for live updates
  });

  const connectedEntities = useMemo(() => {
    if (!normOrgId) return [];
    const connectedIds = records
      .filter(
        (r) =>
          r.status === "accepted" &&
          (matchesOrg(r.fromOrgId, normOrgId) || matchesOrg(r.toOrgId, normOrgId)),
      )
      .map((r) => (matchesOrg(r.fromOrgId, normOrgId) ? r.toOrgId : r.fromOrgId));

    return connectedIds
      .map((id) => getEntity(id) || ALL_ENTITIES.find((e) => e.id === id || e.orgUuid === id || e.slug === id))
      .filter(Boolean) as Entity[];
  }, [records, normOrgId]);

  const receivedRequests = useMemo(() => {
    if (!normOrgId) return [];
    const senderIds = records
      .filter(
        (r) =>
          r.status === "pending" &&
          matchesOrg(r.toOrgId, normOrgId) &&
          !connectedEntities.some((c) => matchesOrg(c.id, r.fromOrgId)),
      )
      .map((r) => r.fromOrgId);

    return senderIds
      .map((id) => getEntity(id) || ALL_ENTITIES.find((e) => e.id === id || e.orgUuid === id || e.slug === id))
      .filter(Boolean) as Entity[];
  }, [records, normOrgId, connectedEntities]);

  const sentRequests = useMemo(() => {
    if (!normOrgId) return [];
    const targetIds = records
      .filter(
        (r) =>
          r.status === "pending" &&
          matchesOrg(r.fromOrgId, normOrgId) &&
          !connectedEntities.some((c) => matchesOrg(c.id, r.toOrgId)),
      )
      .map((r) => r.toOrgId);

    return targetIds
      .map((id) => getEntity(id) || ALL_ENTITIES.find((e) => e.id === id || e.orgUuid === id || e.slug === id))
      .filter(Boolean) as Entity[];
  }, [records, normOrgId, connectedEntities]);

  const isConnected = (targetOrgId: string): boolean => {
    if (!normOrgId || !targetOrgId) return false;
    if (matchesOrg(normOrgId, targetOrgId)) return true;
    return records.some(
      (r) =>
        r.status === "accepted" &&
        ((matchesOrg(r.fromOrgId, normOrgId) && matchesOrg(r.toOrgId, targetOrgId)) ||
          (matchesOrg(r.fromOrgId, targetOrgId) && matchesOrg(r.toOrgId, normOrgId))),
    );
  };

  const getConnectionStatus = (
    targetOrgId: string,
  ): "none" | "sent_pending" | "received_pending" | "connected" => {
    if (!normOrgId || !targetOrgId) return "none";
    if (matchesOrg(normOrgId, targetOrgId)) return "connected";

    const conn = records.find(
      (r) =>
        (matchesOrg(r.fromOrgId, normOrgId) && matchesOrg(r.toOrgId, targetOrgId)) ||
        (matchesOrg(r.fromOrgId, targetOrgId) && matchesOrg(r.toOrgId, normOrgId)),
    );

    if (!conn) return "none";
    if (conn.status === "accepted") return "connected";
    if (conn.status === "pending") {
      return matchesOrg(conn.fromOrgId, normOrgId) ? "sent_pending" : "received_pending";
    }
    return "none";
  };

  return {
    records,
    connectedEntities,
    receivedRequests,
    sentRequests,
    isConnected,
    getConnectionStatus,
    isLoading,
    refetch,
  };
}

/** Hook to send a connection request */
export function useRequestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fromOrgId, toOrgId }: { fromOrgId: string; toOrgId: string }) =>
      sendOrgConnection({ data: { fromOrgId, toOrgId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-connections"] });
    },
  });
}

/** Hook to accept or decline a connection request */
export function useRespondConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      myOrgId,
      otherOrgId,
      status,
    }: {
      myOrgId: string;
      otherOrgId: string;
      status: "accepted" | "declined";
    }) => respondOrgConnection({ data: { myOrgId, otherOrgId, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-connections"] });
    },
  });
}

// Synchronous legacy helpers for components with pure fallback
export function isOrgsConnected(orgAId: string, orgBId: string): boolean {
  if (matchesOrg(orgAId, orgBId)) return true;
  return false;
}

export function getConnectionStatus(
  myOrgId: string,
  targetOrgId: string,
): "none" | "sent_pending" | "received_pending" | "connected" {
  if (matchesOrg(myOrgId, targetOrgId)) return "connected";
  return "none";
}
