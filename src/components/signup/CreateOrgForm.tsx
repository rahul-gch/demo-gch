import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { refreshRegistry } from "@/lib/registry";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createOrg } from "@/lib/orgs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ORG_TYPES } from "@/lib/org-types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Single-step onboarding: create the account and the organization in one go.
 * When the visitor is already signed in, only the organization fields show.
 * Everything else (logo, country, website, certifications, operations…) is
 * filled in later from Organization settings.
 */
export function CreateOrgForm({ signedIn }: { signedIn: boolean }) {
  const nav = useNavigate();
  const createOrgFn = useServerFn(createOrg);
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveType = type === "Other" ? customType.trim() : type;

  const accountReady = signedIn
    ? true
    : fullName.trim().length >= 2 &&
      /\S+@\S+\.\S+/.test(email.trim()) &&
      password.length >= 8 &&
      password === confirm;

  const canSubmit = useMemo(
    () => accountReady && name.trim().length >= 2 && effectiveType.length >= 2 && !submitting,
    [accountReady, name, effectiveType, submitting],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!signedIn) {
        const mail = email.trim().toLowerCase();
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: { full_name: fullName.trim() },
          },
        });

        if (signUpErr) {
          const msg = signUpErr.message.toLowerCase();
          const alreadyRegistered =
            msg.includes("already registered") ||
            msg.includes("already been registered") ||
            msg.includes("user already exists");
          if (!alreadyRegistered) throw signUpErr;
          // Account already exists — sign in with the given password instead.
          const { error: siErr } = await supabase.auth.signInWithPassword({
            email: mail,
            password,
          });
          if (siErr)
            throw new Error(
              "An account already exists for this email. Sign in with your existing password instead.",
            );
        } else if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: mail,
            password,
          });
          if (signInErr) throw signInErr;
        }
      }

      const res = await createOrgFn({
        data: {
          name: name.trim(),
          slug: slugify(name) || "org",
          type: effectiveType,
        },
      });

      await refreshRegistry(queryClient);
      toast.success("Workspace ready — add your details in Settings");
      nav({ to: "/organizations/$id", params: { id: res.id }, replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create organization";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={submit} className="space-y-5">
      {!signedIn && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ob-name">Your name *</Label>
            <Input
              id="ob-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-email">Work email *</Label>
            <Input
              id="ob-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ob-password">Password *</Label>
              <Input
                id="ob-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-confirm">Confirm password *</Label>
              <Input
                id="ob-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Use 8+ characters with a mix of letters, numbers and symbols. Common or breached
            passwords are rejected.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="org-name">Organization name *</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Cotton Mills"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Organization type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {ORG_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {type === "Other" && (
            <Input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Describe your organization type"
              className="mt-2"
            />
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        That's all we need. Country, logo, website, description, certifications, materials and
        operations details can be added any time from your organization's Settings page.
      </p>

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitting
          ? "Setting up your workspace…"
          : signedIn
            ? "Create organization"
            : "Create account & workspace"}
      </Button>
    </form>
  );
}
