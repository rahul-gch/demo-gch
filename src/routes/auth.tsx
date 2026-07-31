import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Global Chain Hub" },
      { name: "description", content: "Sign in to access your Global Chain Hub workspace." },
    ],
  }),
  component: AuthPage,
});

function sanitizeNext(next: string | undefined): string {
  if (!next) return "/";
  try {
    // Allow only same-origin relative paths
    if (next.startsWith("/") && !next.startsWith("//")) return next;
    const u = new URL(next, window.location.origin);
    if (u.origin === window.location.origin) return u.pathname + u.search + u.hash;
  } catch {
    /* noop */
  }
  return "/";
}

function AuthPage() {
  const nav = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: sanitizeNext(next), replace: true });
    });
  }, [nav, next]);

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const target = sanitizeNext(next);
      if (target !== "/") sessionStorage.setItem("gch:post-auth", target);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth/callback",
      });
      if (result.error) {
        toast.error(result.error.message || "Sign in failed");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      // Popup / web_message returned tokens: session already set
      nav({ to: target, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Globe2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Sign in to Global Chain Hub</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Sustainability-first supply chain collaboration.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={signInGoogle}
            disabled={loading}
            className="w-full"
            size="lg"
            variant="outline"
          >
            <GoogleIcon />
            <span className="ml-2">{loading ? "Signing in…" : "Continue with Google"}</span>
          </Button>
          <div className="relative text-center text-xs text-muted-foreground">
            <span className="relative z-10 bg-card px-2">or use your email</span>
            <div className="absolute inset-x-0 top-1/2 border-t" />
          </div>
          <EmailAuthForm
            mode="signin"
            onSignedIn={() => nav({ to: sanitizeNext(next), replace: true })}
          />
          <p className="text-center text-xs text-muted-foreground">
            Setting up a new organization?{" "}
            <a href="/signup" className="text-primary hover:underline">Create an organization</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6.02-2.74-6.02-6.1S8.69 5.9 12 5.9c1.88 0 3.14.8 3.86 1.48l2.63-2.55C16.87 3.34 14.63 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c6.93 0 9.2-4.87 9.2-9.11 0-.61-.07-1.08-.16-1.55H12z"
      />
    </svg>
  );
}
