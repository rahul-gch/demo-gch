import { useState, memo } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** "cover" crops to fill; "contain" shows the whole photo on a muted background. */
  fit?: "cover" | "contain";
  placeholderLabel?: string | null;
}

/**
 * Image with a graceful placeholder for missing or broken sources.
 * Never renders browser alt-text fallbacks.
 */
export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className,
  fit = "cover",
  placeholderLabel = "No image provided",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setFailed(false);
  }

  if (!src || failed) {
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
      src={src}
      alt={alt}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
});
