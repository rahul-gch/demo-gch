import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Network, LogIn, ShieldCheck } from "lucide-react";
import { DEMO_ACCOUNTS, getCurrentUser, signIn } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — GCH Ecosystem" },
      { name: "description", content: "Demo sign in for the GCH Ecosystem prototype." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getCurrentUser()) navigate({ to: "/" });
  }, [navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const user = signIn(username, password);
    if (!user) {
      setError("Invalid username or password.");
      return;
    }
    navigate({ to: "/" });
  }

  function fillDemo(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
            <Network className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">GCH Ecosystem</div>
            <div className="text-[11px] text-muted-foreground">Enterprise traceability platform</div>
          </div>
        </div>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* Login card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              Secure access
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in to your workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose any demo account to enter the corresponding role workspace.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="••••••"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            </form>

            <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Prototype authentication — no data leaves this browser.
            </div>
          </div>

          {/* Demo accounts */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              Demo accounts
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Tap to autofill</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each persona lands in a different workspace tailored to their job.
            </p>

            <ul className="mt-5 space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.username}>
                  <button
                    type="button"
                    onClick={() => fillDemo(a.username, a.password)}
                    className="group flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-foreground/40 hover:bg-accent"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.roleLabel}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-muted-foreground">
                      <div>{a.username}</div>
                      <div>{a.password}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
