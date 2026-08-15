import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { myOrgMemberships } from "@/lib/orgs.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { PASSWORD_RULES, passwordStrength, validatePassword } from "@/lib/policies";

export const Route = createFileRoute("/reset-password")({
  // Recovery sessions are hydrated in the browser from the email link.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Global Chain Hub" },
      { name: "description", content: "Choose a new password for your Global Chain Hub account." },
      { property: "og:title", content: "Set a new password — Global Chain Hub" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  // Fallback state — no recovery session (expired link or direct visit).
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const strength = passwordStrength(password);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weak = validatePassword(password);
    if (weak) {
      toast.error(weak);
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    // Land where the account can actually go: workspace when the user belongs
    // to an organization, otherwise the get-started screen.
    let hasOrg = false;
    try {
      const memberships = await myOrgMemberships();
      hasOrg = (memberships?.length ?? 0) > 0;
    } catch {
      hasOrg = true; // don't bounce a real member to /welcome on a lookup hiccup
    }
    setBusy(false);
    nav({ to: hasOrg ? "/" : "/welcome", replace: true });
  };

  const resend = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      toast.error("Enter your email first");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setSending(false);
    if (error) {
      toast.error(
        /rate|limit|seconds/i.test(error.message)
          ? "Too many requests — please wait a minute before trying again."
          : error.message,
      );
      return;
    }
    setCooldown(60);
    toast.success("New reset link sent — check your inbox");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !ready ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This reset link is expired or was opened directly. Enter your email and we'll send
                you a fresh link.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <Button className="w-full" onClick={resend} disabled={sending || cooldown > 0}>
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cooldown > 0 ? `Send me a new link (${cooldown}s)` : "Send me a new link"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Remembered it?{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-current transition-all"
                        style={{ width: `${strength.pct}%` }}
                      />
                    </div>
                    <p className={`text-xs ${strength.tone}`}>
                      Password strength: {strength.label}
                    </p>
                  </div>
                )}
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {PASSWORD_RULES.map((rule) => (
                    <li key={rule}>• {rule}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
