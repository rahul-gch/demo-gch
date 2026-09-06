import { useState, memo } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  /** Optimized thumbnail source for showroom cards and preview grids to prevent moiré distortion. */
  thumbnailSrc?: string | null;
  alt: string;
  className?: string;
  /** "cover" crops to fill; "contain" shows the whole photo on a muted background. */
  fit?: "cover" | "contain";
  placeholderLabel?: string | null;
  srcSet?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
}

/**
 * Image with a graceful placeholder for missing or broken sources.
 * Supports optimized thumbnails to eliminate moiré artifacts on textured fabrics.
 * Never renders browser alt-text fallbacks.
 */
export const ProductImage = memo(function ProductImage({
  src,
  thumbnailSrc,
  alt,
  className,
  fit = "cover",
  placeholderLabel = "No image provided",
  srcSet,
  sizes,
  loading = "lazy",
}: ProductImageProps) {
  const effectiveSrc = thumbnailSrc || src;
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(effectiveSrc);

  if (prevSrc !== effectiveSrc) {
    setPrevSrc(effectiveSrc);
    setFailed(false);
  }

  if (!effectiveSrc || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <Package className="h-8 w-8 stroke-[1.25]" />
        {placeholderLabel && <span className="text-xs">{placeholderLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={effectiveSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      style={{
        imageRendering: "auto",
        backfaceVisibility: "hidden",
      }}
      className={cn(
        "h-full w-full transform-gpu",
        fit === "cover" ? "object-cover" : "object-contain",
        className,
      )}
    />
  );
});

