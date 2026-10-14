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
  try {
    if (queryClient) {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
    await supabase.removeAllChannels();
    clearOrgStorage();
    await supabase.auth.signOut();
  } finally {
    redirect();
  }
}
