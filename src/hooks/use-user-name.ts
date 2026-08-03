import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function nameFrom(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const full = (meta["full_name"] || meta["name"] || meta["display_name"]) as string | undefined;
  if (full && full.trim()) return full.trim().split(/\s+/)[0]!;
  const email = user.email ?? "";
  const local = email.split("@")[0];
  if (!local) return null;
  const first = local.split(/[._-]/)[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** First name of the signed-in user, or null while unknown. */
export function useUserName(): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setName(nameFrom(data.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setName(nameFrom(session?.user ?? null));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return name;
}
