# Fix broken showroom product images and tidy the product page

## What is wrong

**Images (confirmed).** The product "TUTGIZA 40 /W E.BLUE" has three uploaded photos stored as private-bucket references (`showroom:<org>/<file>.JPG`). The server functions that load products try to turn those references into signed links using the *browser* database client, which has no login session on the server. Signing silently fails, the code falls back to the raw reference, and the page ends up rendering `<img src="showroom:...">` — a broken image. This affects the product page, the showroom grid, the order pages and the dashboard strip alike.

**Hidden follow-up bug.** Because the editor receives already-resolved links, saving a product from the Edit dialog would overwrite the stored references with temporary signed URLs (valid 1 hour) — after which the images break permanently. Editing must keep the original references.

**Layout / description.** The description is a single wall of text; spec lines like `CODE DRS508545`, `WEIGHT B.W. (OZ/YD²) 7,5` deserve a proper key/value table. The gallery and detail column also have alignment issues (thumbnail strip not aligned to the cover, cover with empty top space, page not constrained in width).

## Changes

### 1. Resolve images with the caller's session (server)
- `showroom.functions.ts`: replace every `resolveImages(rawImages)` call (list, get, upsert, order helpers — 5 sites) with a server-side resolver that uses `context.supabase` (the authenticated client from `requireSupabaseAuth`) to create the signed URLs.
- Add `resolveImagesWith(client, values)` to `org-images.ts` so the browser and server share one implementation; keep the existing `resolveImages` as a thin wrapper for browser use.
- Return both `images` (display URLs) and `imageRefs` (raw stored values) on `ShowroomProduct`.

### 2. Keep stored references intact when editing
- `ProductEditorDialog.tsx`: seed the form from `product.imageRefs` (raw values) while showing previews from the resolved URLs, and send `imageRefs` back on save. No more signed URLs written to the database.

### 3. Product page layout and description
- `ProductDetailPage.tsx`:
  - Constrain content to a max width and align the gallery: cover uses a square/4:3 frame with `object-contain` on a light background so fabric photos are not cropped; thumbnails sit in a horizontal strip with equal size and a clear selected state; broken-image fallback shows the "No image" placeholder instead of alt text.
  - Parse the description: free-text paragraph(s) stay as prose; lines that look like `LABEL value` (CODE, COLOR, WEIGHT, WIDTH, WEAVE, ELASTICITY, SHRINKAGE, COMPOSITION, etc.) render in a two-column **Specifications** table below the description. Pure prose still renders as-is.
  - Move the materials badges under the title, and the "own listing / order sample" card into a sticky right column so the header row (Back · Published · Edit · Delete) and the two columns line up consistently.
- `ProductCard.tsx` / `ShowroomStrip.tsx`: add the same broken-image fallback so grids never show alt text.

## Verification
- Open the Sharabati product page as the owner: all three photos show, thumbnails switch the cover.
- Open the same product from a connected org via the directory: images visible, "Order sample" works.
- Edit the product (change description only), save, reload: images still show and the stored values remain `showroom:` references.
- Spec lines render as a table; paragraph text renders as prose.
