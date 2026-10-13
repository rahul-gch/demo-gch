import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { GchLogo } from "@/components/GchLogo";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  // Session state lives in localStorage, so this page is client-only —
  // server-rendering it produces a hydration mismatch.
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Global Chain Hub" },
      { name: "description", content: "Sign in to access your Global Chain Hub workspace." },
      { property: "og:title", content: "Sign in — Global Chain Hub" },
      { property: "og:description", content: "Sign in to your Global Chain Hub workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const [, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) nav({ to: sanitizeNext(next), replace: true });
      setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [nav, next]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <GchLogo />
          </div>
          <CardTitle className="text-xl">Sign in to Global Chain Hub</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            B2B Partnership Platform for the Global Textile Supply Chain
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailAuthForm
            mode="signin"
            onSignedIn={() => nav({ to: sanitizeNext(next), replace: true })}
          />
          <p className="text-center text-xs text-muted-foreground">
            New to Global Chain Hub?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Register your company
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
