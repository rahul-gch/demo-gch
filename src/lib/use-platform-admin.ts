import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { amIPlatformAdmin } from "@/lib/admin.functions";

/** Shares the ["platform-admin"] cache with the sidebar. */
export function useIsPlatformAdmin() {
  const check = useServerFn(amIPlatformAdmin);
  const q = useQuery({ queryKey: ["platform-admin"], queryFn: () => check(), staleTime: 5 * 60_000 });
  return { isAdmin: !!q.data?.isAdmin, isLoading: q.isLoading };
}
