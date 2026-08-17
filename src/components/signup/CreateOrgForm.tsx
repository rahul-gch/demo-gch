import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { refreshRegistry } from "@/lib/registry";

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
 * in the onboarding profile steps.
 */
export function CreateOrgForm({
  onCreated,
}: { signedIn?: boolean; onCreated?: (orgId: string) => void } = {}) {
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
      toast.success("Organization created — let's complete your profile");
      if (onCreated) {
        onCreated(res.id);
      } else {
        nav({ to: "/onboarding/org/$id", params: { id: res.id }, replace: true });
      }
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
        {submitting ? "Setting up your workspace…" : "Create organization"}
      </Button>
    </form>
  );
}
