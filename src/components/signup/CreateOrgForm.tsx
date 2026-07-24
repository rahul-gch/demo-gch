import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createOrg } from "@/lib/orgs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const ORG_TYPES = [
  "Brand",
  "Farmer",
  "Ginner",
  "Spinner",
  "Fabric Mill",
  "Dye House",
  "Garment Factory",
  "Logistics Provider",
  "Certification Body",
  "Sustainability Partner",
];

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const COMMON_CERTS = [
  "GOTS",
  "OEKO-TEX",
  "Fair Trade",
  "GRS",
  "OCS",
  "BSCI",
  "SA8000",
  "ISO 14001",
  "ISO 9001",
  "SEDEX",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function CreateOrgForm({ signedIn }: { signedIn: boolean }) {
  const nav = useNavigate();
  const createOrgFn = useServerFn(createOrg);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [region, setRegion] = useState("");
  const [tier, setTier] = useState<string>("");
  const [certs, setCerts] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const canSubmit = useMemo(
    () => signedIn && name.trim().length >= 2 && slug.length >= 2 && type && country.trim() && !submitting,
    [signedIn, name, slug, type, country, submitting],
  );

  const addCert = (c: string) => {
    const v = c.trim();
    if (!v) return;
    if (certs.includes(v)) return;
    setCerts([...certs, v]);
    setCertInput("");
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Logo must be an image");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    setLogoFile(f);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // 1. Upload logo first if present, to a temp path (we don't know org id yet).
      //    We upload to a random path under "pending/{uid}/...". Because RLS
      //    requires org_id in path, we instead upload AFTER org creation.
      //    Approach: create org first without logo, then upload + update.

      const payload = {
        name: name.trim(),
        slug: slug || slugify(name),
        type,
        country: country.trim(),
        website: website.trim() || null,
        description: description.trim() || null,
        size: size || null,
        region: region.trim() || null,
        tier: tier ? Number(tier) : null,
        certifications: certs.length ? certs : null,
        logoPath: null,
      };
      const res = await createOrgFn({ data: payload });

      if (logoFile && res?.id) {
        const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${res.id}/logo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("org-logos")
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upErr) {
          toast.warning(`Org created, but logo upload failed: ${upErr.message}`);
        } else {
          const { data: pub } = supabase.storage.from("org-logos").getPublicUrl(path);
          await supabase.from("orgs").update({ logo_url: pub.publicUrl }).eq("id", res.id);
        }
      }

      toast.success("Organization created");
      nav({ to: "/organizations/$id", params: { id: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create organization");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <fieldset disabled={!signedIn} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Organization name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Cotton Mills" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="acme-cotton-mills"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Organization type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Country *</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo (optional)</Label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                {logoFile ? "Change image" : "Upload image"}
              </Button>
              {logoFile && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoFile(null)}>
                  Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG/JPG, up to 2 MB</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? "Hide profile details" : "Add profile details (optional)"}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger><SelectValue placeholder="Team size" /></SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">Region</Label>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Tamil Nadu" />
              </div>
              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((t) => <SelectItem key={t} value={String(t)}>Tier {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Certifications</Label>
              <div className="flex flex-wrap gap-1.5">
                {certs.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1">
                    {c}
                    <button
                      type="button"
                      onClick={() => setCerts(certs.filter((x) => x !== c))}
                      className="ml-1 opacity-60 hover:opacity-100"
                      aria-label={`Remove ${c}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCert(certInput);
                    }
                  }}
                  placeholder="Add certification and press Enter"
                />
                <Button type="button" variant="outline" onClick={() => addCert(certInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_CERTS.filter((c) => !certs.includes(c)).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => addCert(c)}
                    className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                  >
                    + {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={!canSubmit} size="lg">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create organization
        </Button>
      </div>
    </div>
  );
}
