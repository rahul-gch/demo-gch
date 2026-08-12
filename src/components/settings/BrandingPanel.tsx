import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ImagePlus, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { updateOrgProfile } from "@/lib/orgs.functions";
import { refreshRegistry } from "@/lib/registry";
import { BANNER_BUCKET, LOGO_BUCKET, makeRef, parseRef, resolveImage } from "@/lib/org-images";
import { useResolvedImage, useResolvedImages } from "@/lib/use-org-images";

const MAX_BANNERS = 4;
const ACCEPT = "image/jpeg,image/png,image/webp";

function validate(file: File, maxMb: number): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Use a JPG, PNG or WebP image.";
  if (file.size > maxMb * 1024 * 1024) return `Image must be under ${maxMb} MB.`;
  return null;
}

const safeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-60);

export function BrandingPanel({
  orgId,
  logo,
  banners,
}: {
  orgId: string | undefined;
  logo?: string | null;
  banners?: string[];
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(updateOrgProfile);

  const [logoValue, setLogoValue] = useState<string | null>(logo ?? null);
  const [bannerValues, setBannerValues] = useState<string[]>(banners ?? []);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLogoValue(logo ?? null), [logo]);
  useEffect(() => setBannerValues(banners ?? []), [banners?.join("|")]);

  const logoPreview = useResolvedImage(logoValue);
  const bannerPreviews = useResolvedImages(bannerValues);

  const persist = async (patch: { logoUrl?: string | null; bannerUrls?: string[] }) => {
    if (!orgId) {
      toast.error("This organization is not editable.");
      return false;
    }
    await save({ data: { orgId, ...patch } });
    await refreshRegistry(queryClient);
    return true;
  };

  const uploadLogo = async (file: File) => {
    const invalid = validate(file, 2);
    if (invalid) return toast.error(invalid);
    if (!orgId) return toast.error("This organization is not editable.");
    setBusy(true);
    try {
      const path = `${orgId}/logo-${Date.now()}-${safeName(file.name)}`;
      const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      const ref = makeRef(LOGO_BUCKET, path);
      if (await persist({ logoUrl: ref })) {
        setLogoValue(ref);
        void resolveImage(ref);
        toast.success("Logo updated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^.*: /, "") : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const removeLogo = async () => {
    setBusy(true);
    try {
      const ref = logoValue ? parseRef(logoValue) : null;
      if (ref) await supabase.storage.from(ref.bucket).remove([ref.path]);
      if (await persist({ logoUrl: null })) {
        setLogoValue(null);
        toast.success("Logo removed");
      }
    } finally {
      setBusy(false);
    }
  };

  const uploadBanners = async (files: FileList) => {
    if (!orgId) return toast.error("This organization is not editable.");
    const room = MAX_BANNERS - bannerValues.length;
    if (room <= 0) return toast.error(`You can keep up to ${MAX_BANNERS} banner images.`);
    const picked = Array.from(files).slice(0, room);
    for (const f of picked) {
      const invalid = validate(f, 5);
      if (invalid) return toast.error(invalid);
    }
    setBusy(true);
    try {
      const refs: string[] = [];
      for (const file of picked) {
        const path = `${orgId}/banner-${Date.now()}-${safeName(file.name)}`;
        const { error } = await supabase.storage.from(BANNER_BUCKET).upload(path, file, { upsert: false });
        if (error) throw new Error(error.message);
        refs.push(makeRef(BANNER_BUCKET, path));
      }
      const next = [...bannerValues, ...refs];
      if (await persist({ bannerUrls: next })) {
        setBannerValues(next);
        toast.success(picked.length === 1 ? "Banner added" : `${picked.length} banners added`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^.*: /, "") : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const removeBanner = async (index: number) => {
    setBusy(true);
    try {
      const value = bannerValues[index];
      const ref = value ? parseRef(value) : null;
      if (ref) await supabase.storage.from(ref.bucket).remove([ref.path]);
      const next = bannerValues.filter((_, i) => i !== index);
      if (await persist({ bannerUrls: next })) {
        setBannerValues(next);
        toast.success("Banner removed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Branding</CardTitle>
        <p className="text-xs text-muted-foreground">
          Your logo and banner photos appear on your dashboard hero and public profile. JPG, PNG or
          WebP — logo up to 2&nbsp;MB, banners up to 5&nbsp;MB each.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
            {logoPreview ? (
              <img src={logoPreview} alt="Organization logo" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {logoValue ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadLogo(f);
                }}
              />
            </label>
            {logoValue && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void removeLogo()}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>

        {/* Banners */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">
              Banner photos{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({bannerValues.length}/{MAX_BANNERS})
              </span>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Add banners
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                disabled={busy || bannerValues.length >= MAX_BANNERS}
                onChange={(e) => {
                  const files = e.target.files;
                  const list = files;
                  e.target.value = "";
                  if (list && list.length) void uploadBanners(list);
                }}
              />
            </label>
          </div>
          {bannerValues.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              No banner photos yet — upload up to {MAX_BANNERS} images for your dashboard hero.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bannerValues.map((value, i) => (
                <div key={value} className="group relative overflow-hidden rounded-lg border">
                  {bannerPreviews[i] ? (
                    <img src={bannerPreviews[i]} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="h-28 w-full animate-pulse bg-muted" />
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2 h-7 w-7"
                    disabled={busy}
                    onClick={() => void removeBanner(i)}
                    title="Remove banner"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
