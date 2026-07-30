import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { listEntities } from "@/lib/entities.functions";
import { hydrateEntities, isRegistryHydrated } from "@/seed/all-entities";

export const entitiesQueryOptions = queryOptions({
  queryKey: ["entities", "registry"],
  queryFn: async () => {
    const entities = await listEntities();
    hydrateEntities(entities);
    return entities;
  },
  staleTime: 5 * 60_000,
});

/** Ensures the in-memory organization registry is populated (safe to call repeatedly). */
export async function ensureRegistry(queryClient: QueryClient) {
  const entities = await queryClient.ensureQueryData(entitiesQueryOptions);
  if (!isRegistryHydrated() && entities.length) hydrateEntities(entities);
  return entities;
}
