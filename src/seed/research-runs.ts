import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getOrgResearchRuns,
  saveOrgResearchRun,
  deleteOrgResearchRun,
} from "@/lib/research.functions";

export type ResearchCandidate = {
  source: "network" | "ai";
  id?: string;
  name: string;
  country: string;
  city?: string;
  entityType: string;
  materials?: string[];
  capabilities?: string[];
  moq?: string;
  leadTimeDays?: number;
  certifications?: string[];
  rationale?: string;
  sourceUrl?: string;
  matchScore?: number;
};

export type ResearchRun = {
  id: string;
  orgId: string;
  query: string;
  params: {
    countries: string;
    industry: string;
    entityType: string;
    limit: number;
  };
  createdAt: number;
  status: "running" | "done" | "failed";
  error?: string;
  aiError?: string;
  results: ResearchCandidate[];
};

/** React Query Hook for loading an organization's research history */
export function useOrgResearchRuns(orgId: string) {
  const getFn = useServerFn(getOrgResearchRuns);

  const query = useQuery({
    queryKey: ["org-research-runs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const res = await getFn({ data: { orgId } });
        return (res as ResearchRun[]) ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  return {
    runs: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/** React Query Hook for saving a research run */
export function useSaveResearchRun() {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveOrgResearchRun);

  return useMutation({
    mutationFn: async (run: ResearchRun) => {
      const res = await saveFn({ data: { run } });
      return res;
    },
    onSuccess: (data, run) => {
      if (data?.runs) {
        qc.setQueryData(["org-research-runs", run.orgId], data.runs);
      }
      qc.invalidateQueries({ queryKey: ["org-research-runs", run.orgId] });
    },
  });
}

/** React Query Hook for deleting a research run */
export function useDeleteResearchRun() {
  const qc = useQueryClient();
  const delFn = useServerFn(deleteOrgResearchRun);

  return useMutation({
    mutationFn: async ({ orgId, runId }: { orgId: string; runId: string }) => {
      const res = await delFn({ data: { orgId, runId } });
      return res;
    },
    onSuccess: (data, vars) => {
      if (data?.runs) {
        qc.setQueryData(["org-research-runs", vars.orgId], data.runs);
      }
      qc.invalidateQueries({ queryKey: ["org-research-runs", vars.orgId] });
    },
  });
}

/** Compatibility helpers */
export function getRunsForOrg(_orgId: string): ResearchRun[] {
  return [];
}

export function createRun(_run: ResearchRun) {}

export function updateRun(_id: string, _patch: Partial<ResearchRun>) {}

export function deleteRun(_id: string) {}
