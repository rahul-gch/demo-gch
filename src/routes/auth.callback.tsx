import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signing in…" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      // Wait for session hydration after OAuth redirect
      for (let i = 0; i < 30; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const stored = sessionStorage.getItem("gch:post-auth");
          sessionStorage.removeItem("gch:post-auth");
          if (!cancelled) nav({ to: stored && stored.startsWith("/") ? stored : "/", replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) nav({ to: "/auth", replace: true });
    };
    void go();
    return () => {
      cancelled = true;
    };
  }, [nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
