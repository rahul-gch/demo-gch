import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

type Mode = "signin" | "signup";

export function EmailAuthForm({
  mode: initialMode,
  onSignedIn,
  compact,
}: {
  mode?: Mode;
  onSignedIn?: () => void;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const strength = (() => {
    if (password.length < 8) return { label: "Too short", tone: "text-destructive" };
    const score =
      Number(/[a-z]/.test(password)) +
      Number(/[A-Z]/.test(password)) +
      Number(/\d/.test(password)) +
      Number(/[^A-Za-z0-9]/.test(password));
    if (score <= 2) return { label: "Weak", tone: "text-amber-600" };
    if (score === 3) return { label: "Good", tone: "text-emerald-600" };
    return { label: "Strong", tone: "text-emerald-700" };
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const mail = email.trim().toLowerCase();
    if (!mail || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return;
        }
        if (password !== confirm) {
          toast.error("Passwords do not match");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: name.trim() ? { full_name: name.trim() } : undefined,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        onSignedIn?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        onSignedIn?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent — check your inbox");
  };

  if (sent) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-center">
        <MailCheck className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
        <p className="text-sm font-medium">Check your inbox to confirm your email</p>
        <p className="mt-1 text-xs text-muted-foreground">
          We sent a confirmation link to <span className="font-medium">{email}</span>. You'll be
          signed in once you confirm.
        </p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "space-y-4"}>
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="auth-name">Your name</Label>
          <Input
            id="auth-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="auth-email">Work email</Label>
        <Input
          id="auth-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
        {mode === "signup" && (
          password.length > 0 ? (
            <p className={`text-xs ${strength.tone}`}>Password strength: {strength.label}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use 8+ characters with a mix of letters, numbers and symbols. Common or breached
              passwords are rejected.
            </p>
          )
        )}
      </div>
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="auth-confirm">Confirm password</Label>
          <Input
            id="auth-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "I already have an account" : "Create an account"}
        </button>
        {mode === "signin" && (
          <button type="button" className="text-muted-foreground hover:underline" onClick={forgot}>
            Forgot password?
          </button>
        )}
      </div>
    </form>
  );
}
