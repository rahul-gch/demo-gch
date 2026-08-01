import { useEffect, useMemo, useRef, useState } from "react";
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
import { Upload } from "lucide-react";
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
 * Short organization setup: just enough to create the workspace.
 * Everything else (description, certifications, materials, operations…)
 * is filled in later from Organization settings.
 */
export function CreateOrgForm({ signedIn }: { signedIn: boolean }) {
  const nav = useNavigate();
  const createOrgFn = useServerFn(createOrg);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [country, setCountry] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const effectiveType = type === "Other" ? customType.trim() : type;

  const canSubmit = useMemo(
    () =>
      signedIn &&
      name.trim().length >= 2 &&
      effectiveType.length >= 2 &&
      country.trim().length >= 2 &&
      !submitting,
    [signedIn, name, effectiveType, country, submitting],
  );

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
      const res = await createOrgFn({
        data: {
          name: name.trim(),
          slug: slugify(name) || "org",
          type: effectiveType,
          country: country.trim(),
        },
      });

      if (logoFile && res?.id) {
        const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${res.id}/logo.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("org-logos")
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upErr) {
          toast.warning(`Organization created, but logo upload failed: ${upErr.message}`);
        } else {
          const { data: pub } = supabase.storage.from("org-logos").getPublicUrl(path);
          await supabase.from("orgs").update({ logo_url: pub.publicUrl }).eq("id", res.id);
        }
      }

      await refreshRegistry(queryClient);
      toast.success("Workspace ready — add your details in Settings");
      nav({ to: "/organizations/$id", params: { id: res.id }, replace: true });
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Organization name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Cotton Mills"
            />
          </div>
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="India"
            />
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
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
      </fieldset>

      <p className="text-xs text-muted-foreground">
        That's all we need. Website, description, certifications, materials and operations details
        can be added any time from your organization's Settings page.
      </p>

      <Button onClick={submit} disabled={!canSubmit} className="w-full" size="lg">
        {submitting ? "Creating workspace…" : "Create organization"}
      </Button>
    </div>
  );
}
