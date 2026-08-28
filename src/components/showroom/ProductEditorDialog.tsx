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
import { supabase } from "@/integrations/supabase/client";
import { makeRef, SHOWROOM_BUCKET } from "@/lib/org-images";
import type { ShowroomProduct } from "@/lib/showroom.functions";
import { toast } from "sonner";
import { Upload, X, Loader2, Plus, Image as ImageIcon } from "lucide-react";

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
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setMaterials(product.materials ?? []);
      setImages(product.images ?? []);
      setIsActive(product.isActive ?? true);
    } else {
      setName("");
      setDescription("");
      setMaterials([]);
      setImages([]);
      setIsActive(true);
    }
  }, [product, open]);

  const handleAddMaterial = (mat: string) => {
    const trimmed = mat.trim();
    if (!trimmed) return;
    if (!materials.includes(trimmed)) {
      setMaterials([...materials, trimmed]);
    }
    setMaterialInput("");
  };

  const handleRemoveMaterial = (mat: string) => {
    setMaterials(materials.filter((m) => m !== mat));
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setImages([...images, trimmed]);
    setImageUrlInput("");
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
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.warn("Upload failed:", err);
      toast.error("Could not upload image. You can also paste an image URL directly.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      // toast is handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? "Edit Product" : "Add Product to Showroom"}</DialogTitle>
            <DialogDescription>
              Showcase your materials, fabrics, and samples to verified supply chain partners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Name */}
            <div className="space-y-1.5">
              <Label htmlFor="product-name" className="text-xs font-semibold">
                Product / Material Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="product-name"
                placeholder="e.g. 100% GOTS Organic Cotton Jersey 180gsm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="product-desc" className="text-xs font-semibold">
                Description & Specifications
              </Label>
              <Textarea
                id="product-desc"
                placeholder="Describe weave, weight, dye processes, certifications, MOQ, and sample availability..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Materials Tags */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Materials & Fibers</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add material (e.g. Organic Cotton) and press Enter"
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

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Quick add:</span>
                {MATERIAL_SUGGESTIONS.map((mat) => (
                  <Badge
                    key={mat}
                    variant="outline"
                    className="cursor-pointer bg-slate-50 text-[10px] text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    onClick={() => handleAddMaterial(mat)}
                  >
                    + {mat}
                  </Badge>
                ))}
              </div>

              {/* Selected Materials */}
              {materials.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
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
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Images Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Product Images</Label>

              {/* Image previews grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video overflow-hidden rounded-md border bg-slate-100"
                    >
                      <img
                        src={
                          img.startsWith("showroom:")
                            ? `https://placehold.co/400x300?text=Product+Image`
                            : img
                        }
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddImageUrl}>
                  Add URL
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{isUploading ? "Uploading..." : "Upload from device"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                <span className="text-[11px] text-muted-foreground">
                  PNG, JPG, or WebP up to 5MB
                </span>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="active-toggle" className="text-xs font-semibold">
                  Publish to Showroom
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  When active, connected supply chain partners can view this product and request
                  samples.
                </p>
              </div>
              <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
            </div>
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
                  Saving...
                </>
              ) : product ? (
                "Update Product"
              ) : (
                "Add Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
