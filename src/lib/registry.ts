import { CancelledError, queryOptions, type QueryClient } from "@tanstack/react-query";
import { listEntities } from "@/lib/entities.functions";
import { hydrateEntities, isRegistryHydrated } from "@/seed/all-entities";

/** True when a query promise was cancelled (e.g. invalidated while in flight). */
export function isCancelled(error: unknown): boolean {
  return (
    error instanceof CancelledError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "CancelledError")
  );
}

/**
 * Runs a query-backed lookup and retries once if the in-flight fetch was
 * cancelled by a cache invalidation (session restore racing a route guard).
 */
export async function retryOnCancel<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isCancelled(error)) throw error;
    return run();
  }
}

export const entitiesQueryOptions = queryOptions({
  queryKey: ["entities", "registry"],
  queryFn: async () => {
    try {
      const entities = await listEntities();
      hydrateEntities(entities);
      return entities;
    } catch {
      // Public pages (no authenticated session) don't need the org registry.
      // On sign-in, onAuthStateChange invalidates this query so it refetches.
      return [];
    }
  },
  staleTime: 5 * 60_000,
});

/** Ensures the in-memory organization registry is populated (safe to call repeatedly). */
export async function ensureRegistry(queryClient: QueryClient) {
  const entities = await retryOnCancel(() => queryClient.ensureQueryData(entitiesQueryOptions));
  if (!isRegistryHydrated() && entities.length) hydrateEntities(entities);
  return entities;
}

/**
 * Forces a fresh fetch of the organization registry and re-hydrates the
 * in-memory lookup. Call after creating or joining an organization so the new
 * org is resolvable before navigating to its workspace.
 */
export async function refreshRegistry(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: entitiesQueryOptions.queryKey });
  const entities = await retryOnCancel(() => queryClient.fetchQuery(entitiesQueryOptions));
  if (entities.length) hydrateEntities(entities);
  return entities;
}
