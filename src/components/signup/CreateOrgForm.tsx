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
import { ENTITY_TYPES } from "@/lib/entity-profiles";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Step 1 of onboarding — deliberately short. Only identity and location are
 * collected here; every entity-specific business question is asked afterwards
 * in the profile wizard at /organizations/:id/profile-setup.
 */
export function CreateOrgForm(_props: { signedIn?: boolean } = {}) {
  const nav = useNavigate();
  const createOrgFn = useServerFn(createOrg);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      name.trim().length >= 2 &&
      type.length >= 2 &&
      country.trim().length >= 2 &&
      !submitting,
    [name, type, country, submitting],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!signedIn) {
        const mail = email.trim().toLowerCase();
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: {
              full_name: fullName,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
            },
          },
        });

        if (signUpErr) {
          const msg = signUpErr.message.toLowerCase();
          const alreadyRegistered =
            msg.includes("already registered") ||
            msg.includes("already been registered") ||
            msg.includes("user already exists");
          if (!alreadyRegistered) throw signUpErr;
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

      const site = website.trim();
      const res = await createOrgFn({
        data: {
          name: name.trim(),
          slug: slugify(name) || "org",
          type,
          country: country.trim() || null,
          city: city.trim() || null,
          website: site ? (/^https?:\/\//i.test(site) ? site : `https://${site}`) : null,
        },
      });

      await refreshRegistry(queryClient);
      toast.success("Account created — let's complete your profile");
      nav({ to: "/organizations/$id/profile-setup", params: { id: res.id }, replace: true });
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ob-first">First name *</Label>
              <Input
                id="ob-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-last">Last name *</Label>
              <Input
                id="ob-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                autoComplete="family-name"
              />
            </div>
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
          <Label>Entity type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-country">Country *</Label>
          <Input
            id="org-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="India"
            autoComplete="country-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-city">City / region</Label>
          <Input
            id="org-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Coimbatore, Tamil Nadu"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="org-website">Website (optional)</Label>
          <Input
            id="org-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="www.acmecotton.com"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Next you'll answer a few questions tailored to your entity type — you can skip any of them
        and finish later from Settings.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitting
          ? "Setting up your workspace…"
          : signedIn
            ? "Create organization"
            : "Create account & continue"}
      </Button>
    </form>
  );
}
