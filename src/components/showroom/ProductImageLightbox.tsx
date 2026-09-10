import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/showroom/ProductImage";
import { getOptimizedThumbnailUrl } from "@/lib/org-images";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface ProductImageLightboxProps {
  images: string[];
  thumbnails?: string[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
  alt: string;
}

interface ViewState {
  zoom: number;
  offset: { x: number; y: number };
}

const RESET: ViewState = { zoom: 1, offset: { x: 0, y: 0 } };

export function ProductImageLightbox({
  images,
  thumbnails,
  index,
  open,
  onOpenChange,
  onIndexChange,
  alt,
}: ProductImageLightboxProps) {
  const [view, setView] = useState<ViewState>(RESET);
  const viewRef = useRef(view);
  viewRef.current = view;

  const count = images.length;
  const current = images[index] ?? null;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      const wrapped = ((next % count) + count) % count;
      onIndexChange(wrapped);
      setView(RESET);
    },
    [count, onIndexChange],
  );

  // Apply a zoom change anchored at a point relative to the container centre.
  const zoomAt = useCallback((nextZoom: number, anchorX = 0, anchorY = 0) => {
    setView((prev) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
      if (zoom === prev.zoom) return prev;
      const k = zoom / prev.zoom;
      return {
        zoom,
        offset: { x: anchorX - (anchorX - prev.offset.x) * k, y: anchorY - (anchorY - prev.offset.y) * k },
      };
    });
  }, []);

  // Non-passive wheel listener: smooth zoom scaled by delta, anchored at cursor.
  // Attached via callback ref so the listener lands exactly when the element mounts
  // (the dialog renders in a portal, so an effect can run before the node exists).
  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    containerElRef.current = el;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      // Image fills the container, so the anchor is the cursor position
      // relative to the container's top-left corner.
      const ax = e.clientX - rect.left;
      const ay = e.clientY - rect.top;
      zoomAtRef.current(viewRef.current.zoom * Math.exp(-dy * 0.0018), ax, ay);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, goTo]);

  // Pointer drag-to-pan + two-finger pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: viewRef.current.zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = containerElRef.current?.getBoundingClientRect();
      const ax = rect ? (a.x + b.x) / 2 - rect.left : 0;
      const ay = rect ? (a.y + b.y) / 2 - rect.top : 0;
      zoomAt(pinchStart.current.zoom * (dist / Math.max(pinchStart.current.dist, 1)), ax, ay);
      return;
    }

    if (viewRef.current.zoom > 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setView((v) => ({ ...v, offset: { x: v.offset.x + dx, y: v.offset.y + dy } }));
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const thumbs = useMemo(
    () =>
      images.map(
        (img, i) => thumbnails?.[i] ?? getOptimizedThumbnailUrl(img, { width: 160 }) ?? img,
      ),
    [images, thumbnails],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] w-screen max-w-none translate-x-[-50%] translate-y-[-50%] flex-col gap-0 border-0 bg-black/95 p-0 sm:rounded-none [&>button]:text-white [&>button]:ring-offset-black"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>

        {/* Zoomed viewport */}
        <div
          ref={containerRef}
          className={cn(
            "relative min-h-0 flex-1 touch-none select-none overflow-hidden",
            view.zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDoubleClick={() =>
            setView((v) => (v.zoom > 1 ? RESET : { zoom: 2, offset: { x: 0, y: 0 } }))
          }
        >
          {current ? (
            <img
              src={current}
              alt={alt}
              draggable={false}
              className="absolute left-1/2 top-1/2 h-full w-full object-contain"
              style={{
                transform: `translate(-50%, -50%) translate(${view.offset.x}px, ${view.offset.y}px) scale(${view.zoom})`,
                transformOrigin: "0 0",
              }}
            />
          ) : (
            <ProductImage src={null} alt={alt} />
          )}
        </div>

        {/* Controls */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="pointer-events-auto rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            {index + 1} of {count}
          </span>
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/60 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomAt(viewRef.current.zoom / 1.25)}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setView(RESET)}
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
              onClick={() => zoomAt(viewRef.current.zoom * 1.25)}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {count > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
              onClick={() => goTo(index - 1)}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
              onClick={() => goTo(index + 1)}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
              {thumbs.map((thumb, i) => (
                <button
                  key={`${thumb}-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-pressed={i === index}
                  className={cn(
                    "h-14 w-14 overflow-hidden rounded-md border border-white/20 transition",
                    i === index
                      ? "ring-2 ring-white"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  <ProductImage src={thumb} alt="" placeholderLabel={null} />
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
