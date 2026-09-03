# Tidy showroom product cards and elevate the showroom header

## Changes

### 1. Remove the redundant "View" button — `src/components/showroom/ProductCard.tsx`
The whole card media and title already link to the product page, so the explicit "View" button duplicates that. Delete the `detailLink` variable, its usages in both footers (owner and visitor), and the now-unused `Eye` icon import. In the visitor footer the "Request sample" / "Connect to order" button then spans the full width; in the owner footer the publish switch row loses its trailing button.

### 2. Remove descriptions from cards — `src/components/showroom/ProductCard.tsx`
Delete the `product.description` paragraph block in `CardHeader` (lines 157–159). Cards show image, name, and material badges only.

### 3. Stronger editorial header — `src/components/showroom/PublicShowroomPage.tsx`
Replace the current store-icon + single-line title block with an editorial masthead:
- Small uppercase tracking-wide eyebrow: the org name (e.g. "SHARABATI")
- Large display heading: "Fabric Showroom"
- Subline: "Explore our collection of fabrics and request physical samples."
- A thin divider under the header for the editorial feel

Styling uses existing semantic tokens (`text-muted-foreground`, `tracking-[0.2em] uppercase` for the eyebrow, `text-3xl sm:text-4xl font-bold tracking-tight` for the heading). Store icon removed; `Store` import dropped if unused.

## Verification
- Open the Sharabati public showroom as a connected org and as the owner: cards show image + name + materials only, no description, no View button; clicking the image or name still opens the product page.
- Header renders as eyebrow / heading / subline; owner showroom workspace (if it reuses the card) still works.
- Typecheck passes.
