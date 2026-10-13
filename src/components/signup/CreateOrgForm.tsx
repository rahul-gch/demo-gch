import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { refreshRegistry } from "@/lib/registry";

import { useServerFn } from "@tanstack/react-start";
import { createOrg } from "@/lib/orgs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { SIGNUP_ENTITY_TYPES } from "@/lib/entity-profiles";
import { CountrySelect } from "@/components/CountrySelect";
import { FEATURED_COUNTRIES } from "@/lib/countries";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Step 1 of onboarding — collects organization identity, physical facility
 * address, headquarters country, and operating production countries.
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
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [operatingCountries, setOperatingCountries] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOperatingCountry = (c: string) => {
    const trimmed = c.trim();
    if (!trimmed) return;
    if (!operatingCountries.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setOperatingCountries([...operatingCountries, trimmed]);
    }
  };

  const removeOperatingCountry = (c: string) => {
    setOperatingCountries(operatingCountries.filter((item) => item.toLowerCase() !== c.toLowerCase()));
  };

  const canSubmit = useMemo(
    () => name.trim().length >= 2 && type.length >= 2 && country.trim().length >= 2 && !submitting,
    [name, type, country, submitting],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const site = website.trim();
      const allCountries = Array.from(
        new Set([country.trim(), ...operatingCountries].filter(Boolean)),
      );
      const res = await createOrgFn({
        data: {
          name: name.trim(),
          slug: slugify(name) || "org",
          type,
          country: country.trim() || null,
          city: city.trim() || null,
          address: address.trim() || null,
          zipCode: zipCode.trim() || null,
          operatingCountries: allCountries,
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
            placeholder="Organization name"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Entity type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {SIGNUP_ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-country">Headquarters country *</Label>
          <CountrySelect
            id="org-country"
            value={country}
            onChange={(c) => {
              setCountry(c);
              if (c && !operatingCountries.some((oc) => oc.toLowerCase() === c.toLowerCase())) {
                setOperatingCountries((prev) => [...prev, c]);
              }
            }}
            placeholder="Select country"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-city">City / region</Label>
          <Input
            id="org-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Istanbul, Marmara"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-address">Street address (optional)</Label>
          <Input
            id="org-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 142 Industrial Blvd, Suite 3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org-zip">Postal / ZIP code (optional)</Label>
          <Input
            id="org-zip"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="e.g. 34100"
          />
        </div>

        {/* Multi-country operating locations */}
        <div className="space-y-2 sm:col-span-2 rounded-lg border bg-muted/20 p-3.5">
          <div className="space-y-0.5">
            <Label className="text-xs font-semibold">Operating / Production Countries (optional)</Label>
            <p className="text-[11px] text-muted-foreground">
              Does your company have mills, plants or offices in multiple countries? (e.g. HQ in Turkey, facility in Egypt). Add them to match with buyers searching either location.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {operatingCountries.map((c) => (
              <Badge
                key={c}
                variant="secondary"
                className="px-2 py-0.5 text-xs gap-1.5 bg-primary/10 text-primary border border-primary/20"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => removeOperatingCountry(c)}
                  className="text-primary/70 hover:text-primary transition-colors focus:outline-none"
                  title={`Remove ${c}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {operatingCountries.length === 0 && (
              <span className="text-[11px] text-muted-foreground italic">
                {country ? `Primary: ${country}` : "Select headquarters country above"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="w-52">
              <CountrySelect
                value=""
                onChange={(val) => {
                  if (val) addOperatingCountry(val);
                }}
                placeholder="Add other country..."
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Quick add:</span>
              {FEATURED_COUNTRIES.filter(
                (c) => !operatingCountries.some((oc) => oc.toLowerCase() === c.toLowerCase()),
              )
                .slice(0, 5)
                .map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => addOperatingCountry(c)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                  >
                    + {c}
                  </button>
                ))}
            </div>
          </div>
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
