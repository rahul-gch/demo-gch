import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { makeRef, resolveImage, SHOWROOM_BUCKET } from "@/lib/org-images";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import { toast } from "sonner";
import {
  Upload,
  X,
  Loader2,
  Plus,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProductEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ShowroomProduct | null;
  orgId: string;
  onSave: (product: {
    id?: string;
    name: string;
    description?: string | null;
    images?: string[];
    materials?: string[];
    isActive?: boolean;
  }) => Promise<unknown>;
}

const MATERIAL_SUGGESTIONS = [
  "Organic Cotton",
  "Recycled Polyester",
  "Linen",
  "Mulberry Silk",
  "Tencel Lyocell",
  "Merino Wool",
  "Hemp",
  "Bamboo Viscose",
  "Circular Denim",
  "Regenerative Wool",
];

function SectionTitle({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
        {step}
      </span>
      <div>
        <h3 className="text-sm font-semibold leading-none">{title}</h3>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function ProductEditorDialog({
  open,
  onOpenChange,
  product,
  orgId,
  onSave,
}: ProductEditorDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialInput, setMaterialInput] = useState("");
  /** Raw stored values (refs or https links) — this is what gets saved. */
  const [images, setImages] = useState<string[]>([]);
  /** Display URL per raw value, for previews only. */
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedName, setTouchedName] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setMaterials(product.materials ?? []);
      const refs = product.imageRefs ?? product.images ?? [];
      setImages(refs);
      const map: Record<string, string> = {};
      refs.forEach((ref, i) => {
        const url = product.images?.[i];
        if (url) map[ref] = url;
      });
      setPreviews(map);
      setIsActive(product.isActive ?? true);
    } else {
      setName("");
      setDescription("");
      setMaterials([]);
      setImages([]);
      setPreviews({});
      setIsActive(true);
    }
    setTouchedName(false);
    setMaterialInput("");
    setImageUrlInput("");
  }, [product, open]);

  const handleAddMaterial = (mat: string) => {
    const trimmed = mat.trim();
    if (!trimmed) return;
    if (!materials.includes(trimmed)) setMaterials([...materials, trimmed]);
    setMaterialInput("");
  };

  const handleRemoveMaterial = (mat: string) => {
    setMaterials(materials.filter((m) => m !== mat));
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error("Image links must start with http:// or https://");
      return;
    }
    setImages([...images, trimmed]);
    setImageUrlInput("");
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPEG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(SHOWROOM_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const ref = makeRef(SHOWROOM_BUCKET, filePath);
      setImages((prev) => [...prev, ref]);
      void resolveImage(ref).then((url) => {
        if (url) setPreviews((prev) => ({ ...prev, [ref]: url }));
      });
      toast.success("Image uploaded");
    } catch (err) {
      console.warn("Upload failed:", err);
      toast.error("Could not upload image. You can also paste an image URL instead.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const nameError = touchedName && !name.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedName(true);
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: product?.id,
        name: name.trim(),
        description: description.trim() || null,
        materials,
        images,
        isActive,
      });
      onOpenChange(false);
    } catch {
      // toast handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? "Edit product" : "Add product to showroom"}</DialogTitle>
            <DialogDescription>
              Showcase your materials and fabrics to verified supply chain partners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-5">
            {/* 1. Basics */}
            <section className="space-y-3">
              <SectionTitle step={1} title="Basics" hint="Name and specification buyers will read." />
              <div className="space-y-1.5">
                <Label htmlFor="product-name" className="text-xs font-medium">
                  Product / material name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder="e.g. GOTS Organic Cotton Jersey 180gsm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouchedName(true)}
                  aria-invalid={nameError}
                  className={nameError ? "border-rose-400 focus-visible:ring-rose-400" : ""}
                />
                {nameError && <p className="text-[11px] text-rose-600">Please enter a name.</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-desc" className="text-xs font-medium">
                  Description & specifications
                </Label>
                <Textarea
                  id="product-desc"
                  placeholder="Weave, weight, dye process, certifications, MOQ, lead time, sample availability…"
                  rows={4}
                  maxLength={3000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-right text-[10px] text-muted-foreground">
                  {description.length}/3000
                </p>
              </div>
            </section>

            <Separator />

            {/* 2. Images */}
            <section className="space-y-3">
              <SectionTitle
                step={2}
                title="Images"
                hint="The first image is used as the cover across the platform."
              />

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img, idx) => {
                    const previewUrl = /^https?:\/\//i.test(img) ? img : previews[img];
                    return (
                      <div
                        key={`${img}-${idx}`}
                        className="group relative aspect-video overflow-hidden rounded-md border bg-slate-100 dark:bg-slate-900"
                      >
                        {previewUrl ? (
                          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                            <span className="text-[10px]">Uploaded image</span>
                          </div>
                        )}

                        {idx === 0 && (
                          <Badge className="absolute left-1.5 top-1.5 bg-slate-900/80 text-[9px] text-white">
                            Cover
                          </Badge>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => moveImage(idx, -1)}
                            disabled={idx === 0}
                            className="rounded-full bg-slate-900/80 p-1 text-white disabled:opacity-30"
                            aria-label="Move image left"
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 1)}
                            disabled={idx === images.length - 1}
                            className="rounded-full bg-slate-900/80 p-1 text-white disabled:opacity-30"
                            aria-label="Move image right"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-md border border-dashed p-4 text-center text-[11px] text-muted-foreground">
                  No images yet — products with photos get significantly more sample requests.
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{isUploading ? "Uploading…" : "Upload from device"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP, up to 5MB</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="…or paste an image URL (https://…)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddImageUrl}>
                  Add link
                </Button>
              </div>
            </section>

            <Separator />

            {/* 3. Materials */}
            <section className="space-y-3">
              <SectionTitle
                step={3}
                title="Materials & fibers"
                hint="Used for search and material filters in the showroom."
              />
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Add a material and press Enter"
                  value={materialInput}
                  onChange={(e) => setMaterialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMaterial(materialInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddMaterial(materialInput)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {materials.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {materials.map((mat) => (
                    <Badge
                      key={mat}
                      variant="secondary"
                      className="gap-1 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                    >
                      {mat}
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(mat)}
                        className="hover:text-rose-600"
                        aria-label={`Remove ${mat}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1">Quick add:</span>
                {MATERIAL_SUGGESTIONS.filter((m) => !materials.includes(m)).map((mat) => (
                  <Badge
                    key={mat}
                    variant="outline"
                    className="cursor-pointer bg-slate-50 text-[10px] font-normal text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    onClick={() => handleAddMaterial(mat)}
                  >
                    + {mat}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator />

            {/* 4. Availability */}
            <section className="space-y-3">
              <SectionTitle step={4} title="Availability" />
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="active-toggle" className="text-xs font-medium">
                    Publish to showroom
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Published products are visible to partner organizations, who can request
                    samples. Hidden products stay visible to your team only.
                  </p>
                </div>
                <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : product ? (
                "Save changes"
              ) : (
                "Add product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
