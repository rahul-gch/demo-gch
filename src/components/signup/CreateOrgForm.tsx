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

const MANUFACTURER_TYPES = new Set([
  "Farmer", "Ginner", "Spinner", "Fabric Mill", "Dye House", "Garment Factory",
]);

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const COMMON_CERTS = [
  "GOTS", "OEKO-TEX", "Fair Trade", "GRS", "OCS", "BSCI", "SA8000", "ISO 14001", "ISO 9001", "SEDEX",
];

const COMMON_MATERIALS = [
  "Cotton", "Organic Cotton", "Recycled Cotton", "Denim", "Wool", "Viscose",
  "Polyester", "Recycled Polyester", "Linen", "Silk", "Hemp", "Nylon",
];

const COMMON_CAPABILITIES = [
  "Spinning", "Weaving", "Knitting", "Dyeing", "Printing", "Finishing",
  "Cut & Sew", "Embroidery", "Washing", "Packaging",
];

const PRODUCT_CATEGORIES = ["Women", "Men", "Kids", "Baby", "Unisex", "Accessories"];
const PRODUCT_TYPES = ["T-shirts", "Denim", "Outerwear", "Loungewear", "Activewear", "Formalwear", "Underwear", "Knitwear"];

const SPECIALIZATION_SUGGESTIONS: Record<string, string[]> = {
  Brand: ["Sportswear", "Womenswear", "Menswear", "Kidswear", "Denim", "Luxury", "Fast fashion", "Outdoor", "Loungewear", "Footwear"],
  "Garment Factory": ["Knitwear", "Denim", "Activewear", "Outerwear", "T-shirts", "Formalwear", "Underwear"],
  "Fabric Mill": ["Denim", "Jersey Knits", "Woven", "Performance Fabrics", "Selvedge"],
  "Dye House": ["Reactive Dyeing", "Indigo", "Pigment", "Digital Print"],
  Spinner: ["Ring-spun", "Open-end", "Compact", "Organic"],
  Ginner: ["Organic Cotton", "BCI Cotton", "Recycled Cotton"],
  Farmer: ["Organic", "Regenerative", "Fair Trade", "BCI"],
  "Logistics Provider": ["Ocean Freight", "Air Freight", "Warehousing", "Customs"],
  "Sustainability Partner": ["Traceability", "Digital Product Passport", "Carbon Accounting", "Audit"],
  "Certification Body": ["GOTS", "OEKO-TEX", "GRS", "Social Audit"],
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function ChipMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {value.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="ml-1 opacity-60 hover:opacity-100"
              aria-label={`Remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder={placeholder || `Add ${label.toLowerCase()} and press Enter`}
        />
        <Button type="button" variant="outline" onClick={() => add(input)}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {options.filter((o) => !value.includes(o)).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => add(o)}
            className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
          >
            + {o}
          </button>
        ))}
      </div>
    </div>
  );
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
  const [materials, setMaterials] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [moq, setMoq] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [capacity, setCapacity] = useState("");
  const [onTimeRate, setOnTimeRate] = useState("");
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

  const isManufacturer = MANUFACTURER_TYPES.has(type);
  const isBrand = type === "Brand";

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
        certifications: certs,
        logoPath: null,
        moq: moq.trim() || null,
        leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
        capacity: capacity.trim() || null,
        onTimeRate: onTimeRate ? Number(onTimeRate) : null,
        materials: isManufacturer ? materials : [],
        capabilities: isManufacturer ? capabilities : [],
        productCategories: isBrand ? productCategories : [],
        productTypes: isBrand ? productTypes : [],
        specializations,
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

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="moq">MOQ</Label>
                <Input id="moq" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="500 pcs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leadTimeDays">Lead time (days)</Label>
                <Input id="leadTimeDays" type="number" min={0} value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} placeholder="45" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="1M units/yr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onTimeRate">On-time rate (%)</Label>
                <Input id="onTimeRate" type="number" min={0} max={100} value={onTimeRate} onChange={(e) => setOnTimeRate(e.target.value)} placeholder="92" />
              </div>
            </div>

            <ChipMultiSelect
              label="Specializations"
              options={SPECIALIZATION_SUGGESTIONS[type] ?? []}
              value={specializations}
              onChange={setSpecializations}
              placeholder="e.g. Sportswear, Denim, Kidswear"
            />

            <ChipMultiSelect
              label="Certifications"
              options={COMMON_CERTS}
              value={certs}
              onChange={setCerts}
            />

            {isManufacturer && (
              <>
                <ChipMultiSelect
                  label="Materials"
                  options={COMMON_MATERIALS}
                  value={materials}
                  onChange={setMaterials}
                />
                <ChipMultiSelect
                  label="Capabilities"
                  options={COMMON_CAPABILITIES}
                  value={capabilities}
                  onChange={setCapabilities}
                />
              </>
            )}

            {isBrand && (
              <>
                <ChipMultiSelect
                  label="Product categories"
                  options={PRODUCT_CATEGORIES}
                  value={productCategories}
                  onChange={setProductCategories}
                />
                <ChipMultiSelect
                  label="Product types"
                  options={PRODUCT_TYPES}
                  value={productTypes}
                  onChange={setProductTypes}
                />
              </>
            )}
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
