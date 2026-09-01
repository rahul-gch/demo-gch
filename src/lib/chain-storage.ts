import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Entity } from "@/seed/types";
import { ALL_ENTITIES, getEntity } from "@/seed/all-entities";
import {
  getOrgChainIds,
  addOrgChainId,
  removeOrgChainId,
} from "./chain-storage.functions";

/** React Query Hook for reading saved chain node IDs */
export function useSavedChainEntityIds(orgId: string) {
  const getFn = useServerFn(getOrgChainIds);

  const query = useQuery({
    queryKey: ["org-chain-draft-ids", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const res = await getFn({ data: { orgId } });
        return (res as string[]) ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  return {
    chainIds: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/** React Query Hook for reading saved chain Entity objects */
export function useSavedChainEntities(orgId: string) {
  const { chainIds, isLoading, refetch } = useSavedChainEntityIds(orgId);

  const entities = (chainIds || [])
    .map((id) => getEntity(id) || ALL_ENTITIES.find((e) => e.id === id))
    .filter(Boolean) as Entity[];

  return {
    entities,
    chainIds,
    isLoading,
    refetch,
  };
}

/** React Query Mutation to add an entity to the supply chain map */
export function useAddChainEntity() {
  const qc = useQueryClient();
  const addFn = useServerFn(addOrgChainId);

  return useMutation({
    mutationFn: async ({ orgId, entityId }: { orgId: string; entityId: string }) => {
      const res = await addFn({ data: { orgId, entityId } });
      return res;
    },
    onSuccess: (data, vars) => {
      if (data?.ids) {
        qc.setQueryData(["org-chain-draft-ids", vars.orgId], data.ids);
      }
      qc.invalidateQueries({ queryKey: ["org-chain-draft-ids", vars.orgId] });
    },
  });
}

/** React Query Mutation to remove an entity from the supply chain map */
export function useRemoveChainEntity() {
  const qc = useQueryClient();
  const removeFn = useServerFn(removeOrgChainId);

  return useMutation({
    mutationFn: async ({ orgId, entityId }: { orgId: string; entityId: string }) => {
      const res = await removeFn({ data: { orgId, entityId } });
      return res;
    },
    onSuccess: (data, vars) => {
      if (data?.ids) {
        qc.setQueryData(["org-chain-draft-ids", vars.orgId], data.ids);
      }
      qc.invalidateQueries({ queryKey: ["org-chain-draft-ids", vars.orgId] });
    },
  });
}

/** Helper fallback functions for backwards compatibility */
export function getSavedChainEntityIds(_orgId?: string): string[] {
  return [];
}

export function saveChainEntityId(_orgId: string, _entityId: string): string[] {
  return [];
}

export function getSavedChainEntities(_orgId: string): Entity[] {
  return [];
}
