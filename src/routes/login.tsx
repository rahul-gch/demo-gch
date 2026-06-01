import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Network, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentUser, setCurrentUser, signInWithEmail, signUpWithEmail, signInWithGoogle,
  roleForOrgType, roleLabelFor, type SessionUser,
} from "@/lib/auth";
import { getMySession } from "@/lib/org.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — GCH Ecosystem" },
      { name: "description", content: "Sign in or create an account on the GCH Ecosystem platform." },
    ],
  }),
  component: LoginPage,
});

type Mode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const fetchSession = useServerFn(getMySession);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getCurrentUser()) navigate({ to: "/" });
  }, [navigate]);

  async function hydrateAndGo() {
    try {
      const s = await fetchSession();
      const user: SessionUser = {
        id: s.userId,
        email: s.email,
        name: s.displayName,
        role: s.isAdmin
          ? "admin"
          : s.orgType
          ? roleForOrgType(s.orgType as "brand" | "supplier" | "verifier" | "regulator")
          : "rahul",
        roleLabel: s.isAdmin ? roleLabelFor("admin") : s.orgType ? roleLabelFor(roleForOrgType(s.orgType as any)) : "New member",
        orgSlug: s.orgSlug,
      };
      setCurrentUser(user);
      navigate({ to: "/" });
    } catch (e) {
      console.error("[login] session hydrate failed", e);
      setError("Signed in, but couldn't load your workspace.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (displayName.trim().length < 2) {
          setError("Please enter your full name.");
          return;
        }
        const { error } = await signUpWithEmail(email.trim(), password, displayName.trim());
        if (error) {
          setError(error.message);
          return;
        }
        // Auto-confirm is enabled, so we can sign in immediately.
        const { error: signInErr } = await signInWithEmail(email.trim(), password);
        if (signInErr) {
          setInfo("Account created. Please sign in.");
          setMode("signin");
          return;
        }
        await hydrateAndGo();
      } else {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setError(error.message);
          return;
        }
        await hydrateAndGo();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  }

  // If Supabase redirect leaves us with an active session, hydrate and go.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) hydrateAndGo();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
            <Network className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">GCH Ecosystem</div>
            <div className="text-[11px] text-muted-foreground">Apparel traceability platform</div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {mode === "signin" ? "Sign in to your workspace" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Access your organisation, partners and evidence."
              : "After signup you'll set up your organisation."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Full name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={8}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={mode === "signin" ? "••••••••" : "At least 8 characters"}
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {mode === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(null); setInfo(null); }} className="font-medium text-foreground hover:underline">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => { setMode("signin"); setError(null); setInfo(null); }} className="font-medium text-foreground hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted at rest. Your data is yours.
          </div>
        </div>
      </div>
    </div>
  );
}
