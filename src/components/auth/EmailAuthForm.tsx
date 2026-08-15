import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import {
  MARKETING_CONSENT_VERSION,
  PASSWORD_RULES,
  PRIVACY_VERSION,
  TERMS_VERSION,
  passwordStrength,
  validatePassword,
} from "@/lib/policies";
import { logSecurityEvent } from "@/lib/security-log";

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
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const t = setTimeout(() => setResetCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCooldown]);

  const strength = passwordStrength(password);

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
        const weak = validatePassword(password);
        if (weak) {
          toast.error(weak);
          return;
        }
        if (!acceptPolicies) {
          toast.error("Please accept the Terms & Conditions and Privacy Policy to continue");
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
        // Supabase obfuscates existing accounts: no error, but an empty
        // identities array. Treat both shapes as "already registered".
        if ((data.user?.identities?.length ?? 1) === 0) {
          setDuplicate(true);
          toast.error("This email already has an account — sign in instead");
          return;
        }
        await recordConsents(data.user?.id ?? null, marketing);
        if (!data.session) {
          setSent(true);
          return;
        }
        void logSecurityEvent("auth.sign_up");
        onSignedIn?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        void logSecurityEvent("auth.sign_in");
        onSignedIn?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (/already registered|already exists|User already/i.test(msg)) {
        setDuplicate(true);
        toast.error("This email already has an account — sign in instead");
      } else if (/rate|limit|seconds/i.test(msg)) {
        toast.error("Too many attempts — please wait a minute and try again.");
      } else {
        toast.error(msg);
      }
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
    if (resetCooldown > 0) return;
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      toast.error(
        /rate|limit|seconds/i.test(error.message)
          ? "Too many requests — please wait a minute before trying again."
          : error.message,
      );
      return;
    }
    setResetCooldown(60);
    void logSecurityEvent("auth.password_reset_requested");
    toast.success("Password reset link sent — check your inbox");
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
          <>
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-current transition-all"
                    style={{ width: `${strength.pct}%` }}
                  />
                </div>
                <p className={`text-xs ${strength.tone}`}>Password strength: {strength.label}</p>
              </div>
            )}
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule}>• {rule}</li>
              ))}
            </ul>
          </>
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
      {mode === "signup" && (
        <div className="space-y-2.5 rounded-md border bg-muted/30 p-3">
          <label className="flex items-start gap-2.5 text-xs leading-relaxed">
            <Checkbox
              checked={acceptPolicies}
              onCheckedChange={(v) => setAcceptPolicies(v === true)}
              className="mt-0.5"
            />
            <span>
              I accept the{" "}
              <a href="/legal/terms" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Terms &amp; Conditions
              </a>{" "}
              and the{" "}
              <a href="/legal/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <Checkbox
              checked={marketing}
              onCheckedChange={(v) => setMarketing(v === true)}
              className="mt-0.5"
            />
            <span>Optional: send me product news and network updates. You can opt out anytime.</span>
          </label>
        </div>
      )}
      {duplicate && mode === "signup" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          This email already has an account.{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => {
              setDuplicate(false);
              setMode("signin");
            }}
          >
            Sign in instead
          </button>{" "}
          or use “Forgot password?” to recover it.
        </div>
      )}
      <Button type="submit" className="w-full" disabled={busy || (mode === "signup" && !acceptPolicies)}>
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

/**
 * Records the policy versions the user accepted at signup. Best-effort: an
 * email-confirmation signup has no session yet, in which case the consent is
 * re-recorded on first sign-in from the privacy centre.
 */
async function recordConsents(userId: string | null, marketing: boolean) {
  if (!userId) return;
  try {
    const now = new Date().toISOString();
    await supabase.from("user_consents").upsert(
      [
        { user_id: userId, policy_type: "terms", policy_version: TERMS_VERSION, accepted: true, accepted_at: now },
        { user_id: userId, policy_type: "privacy", policy_version: PRIVACY_VERSION, accepted: true, accepted_at: now },
        {
          user_id: userId,
          policy_type: "marketing",
          policy_version: MARKETING_CONSENT_VERSION,
          accepted: marketing,
          accepted_at: now,
        },
      ],
      { onConflict: "user_id,policy_type,policy_version" },
    );
  } catch {
    /* consent capture must not block account creation */
  }
}
