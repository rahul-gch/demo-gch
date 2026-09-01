import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getOrgMatchPreferences,
  saveOrgMatchPreferences,
} from "./match-preferences.functions";

export interface MatchPreferences {
  targetTiers: string[];
  targetCountries: string[];
  targetMaterials: string[];
  productCategories: string[];
  certifications: string[];
  maxLeadTimeDays?: number | null;
  minOnTimeRate?: number | null;
}

export const DEFAULT_PREFERENCES: MatchPreferences = {
  targetTiers: [],
  targetCountries: [],
  targetMaterials: [],
  productCategories: [],
  certifications: [],
  maxLeadTimeDays: null,
  minOnTimeRate: null,
};

/** React Query Hook for reading match preferences */
export function useOrgMatchPreferences(orgId: string) {
  const getFn = useServerFn(getOrgMatchPreferences);

  const query = useQuery({
    queryKey: ["org-match-preferences", orgId],
    queryFn: async () => {
      if (!orgId) return DEFAULT_PREFERENCES;
      try {
        const res = await getFn({ data: { orgId } });
        return (res as MatchPreferences) ?? DEFAULT_PREFERENCES;
      } catch {
        return DEFAULT_PREFERENCES;
      }
    },
    staleTime: 60_000,
  });

  return {
    preferences: query.data ?? DEFAULT_PREFERENCES,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

/** React Query Hook for saving match preferences */
export function useSaveOrgMatchPreferences() {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveOrgMatchPreferences);

  return useMutation({
    mutationFn: async ({ orgId, prefs }: { orgId: string; prefs: MatchPreferences }) => {
      const res = await saveFn({ data: { orgId, prefs } });
      return res;
    },
    onSuccess: (_, vars) => {
      qc.setQueryData(["org-match-preferences", vars.orgId], vars.prefs);
      qc.invalidateQueries({ queryKey: ["org-match-preferences", vars.orgId] });
    },
  });
}

/** Pure helper fallback without localStorage */
export function getMatchPreferences(_orgId?: string): MatchPreferences {
  return DEFAULT_PREFERENCES;
}
