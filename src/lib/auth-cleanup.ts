import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ORG_STORAGE_PATTERNS = [/active[-_]?org/i, /acting[-_]?org/i, /current[-_]?org/i];

function clearOrgStorage() {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && ORG_STORAGE_PATTERNS.some((re) => re.test(k))) keys.push(k);
      }
      keys.forEach((k) => store.removeItem(k));
    } catch {
      /* storage unavailable */
    }
  }
}

/** Single sign-out path: drops cached data, live channels and org selection before signing out. */
export async function signOutAndClearSession(
  queryClient: QueryClient | null | undefined,
  redirect: () => void,
) {
  // Each cleanup step is isolated so one failure never skips backend sign-out.
  const safe = async (fn: () => unknown) => {
    try {
      await fn();
    } catch (e) {
      console.warn("[signOut] cleanup step failed", e);
    }
  };
  try {
    if (queryClient) {
      await safe(() => queryClient.cancelQueries());
      await safe(() => queryClient.clear());
    }
    await safe(() => supabase.removeAllChannels());
    await safe(() => clearOrgStorage());
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("[signOut] backend sign-out failed, clearing local session", error);
      await safe(() => supabase.auth.signOut({ scope: "local" }));
    }
    // Drop anything an in-flight request repopulated during sign-out.
    await safe(() => queryClient?.clear());
  } finally {
    redirect();
  }
}
