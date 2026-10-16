import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkPlatformAdmin } from "@/lib/admin-check";

/** Platform-admin check scoped to the signed-in user, so switching accounts never reuses a stale answer. */
export function usePlatformAdmin() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserId(data.session?.user.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUserId(session?.user.id ?? null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return useQuery({
    queryKey: ["platform-admin", userId],
    queryFn: () => checkPlatformAdmin(),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useIsPlatformAdmin() {
  const q = usePlatformAdmin();
  return { isAdmin: !!q.data?.isAdmin, isLoading: q.isPending && q.fetchStatus !== "idle" ? true : q.isLoading };
}
