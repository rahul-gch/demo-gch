# Add image preview & zoom to the showroom product page

## What users get
On a product page (both the owner's showroom view and the public/connected-partner view), clicking the main photo opens a full-screen viewer where visitors can:
- See the photo large on a dark backdrop
- Zoom in/out with the mouse wheel, +/- buttons, or double-click (and pinch on touch screens)
- Drag the zoomed photo around to inspect fabric detail
- Move between photos with arrow keys, on-screen arrows, and a thumbnail strip
- Close with Esc, the X button, or clicking the backdrop

## Changes

### 1. New `ProductImageLightbox.tsx` (in `src/components/showroom/`)
- Built on the existing `Dialog` component (full-screen, dark overlay).
- Receives the product's image list and the active index.
- Zoom behaviour:
  - Wheel zoom scaled by scroll amount (smooth, not jumpy), zoom range 1x–4x, anchored at the cursor so the point under the mouse stays still.
  - Trackpad pinch (ctrl+wheel) works the same way; touch pinch via pointer events with `touch-action: none`.
  - Native non-passive wheel listener (React's `onWheel` can't block page scroll).
  - Drag-to-pan only when zoomed in; zoom resets when switching photos.
- Controls: close button, zoom in/out/reset buttons, previous/next arrows, image counter ("2 of 3"), thumbnail strip when more than one photo.
- Reuses `ProductImage` fallback behaviour so a broken photo shows the placeholder, never browser alt text.

### 2. Wire into `ProductDetailPage.tsx`
- Clicking the cover photo (with a subtle zoom-in icon hint on hover) opens the lightbox at the current image; clicking a thumbnail still just changes the cover.
- Works identically in `member` and `public` modes — connected partners viewing via the directory get the same preview.

## Technical details
- Files: new `src/components/showroom/ProductImageLightbox.tsx`; small edits to `src/components/showroom/ProductDetailPage.tsx` (state for lightbox open, click handler).
- No database or server changes. No new packages — zoom/pan is hand-rolled with the corrected wheel/pinch math.
- Images shown in the lightbox use the already-resolved full-size signed URLs (not the 160px thumbnails).

## Verification
- Open a product with multiple photos in the preview: click cover → lightbox opens; wheel zooms smoothly around cursor; arrows/thumbnails switch photos; Esc closes.
- Confirm from the public directory view as a connected org.
- Confirm single-photo products open the lightbox without arrows/thumbnail strip.
