# Tighten Showroom Product Cards

## Goal
Make the showroom product grid feel denser and more editorial by removing empty space, flattening the cards, and surfacing a single line of product metadata. Keep the primary "Request sample" action prominent and add a subtle "View details" secondary action.

## Changes

### 1. `src/components/showroom/ProductCard.tsx`
- Remove heavy `Card` shadows; use `shadow-none border` with `border-border/60`.
- Tighten vertical rhythm:
  - Image area: `aspect-[4/3]` instead of `aspect-video`, no outer card padding around media.
  - Title + metadata block: compact `p-3` area with no separate `CardHeader`/`CardContent`/`CardFooter` gaps.
- Add a one-line metadata row directly under the product name using the first available of:
  1. First material tag rendered as plain text (e.g. "100% Organic Cotton").
  2. If no materials, a short truncated description snippet (max 60 chars).
- Actions:
  - Primary: full-width "Request sample" button (kept as today).
  - Secondary: subtle "View details" text link below the button, aligned right, using the same `DetailLink`.
- Owner/manage mode:
  - Keep the publish toggle on one row.
  - Move Edit/Delete to icon-only ghost buttons on the same row to save height.
- Hover state: very subtle `hover:border-primary/30` instead of shadow lift.

### 2. `src/components/showroom/PublicShowroomPage.tsx`
- Reduce grid gap from `gap-6` to `gap-4` so cards sit closer together.
- Keep the editorial header and filters unchanged.

### 3. `src/components/showroom/ShowroomStrip.tsx` (dashboard strip)
- Apply the same compact card styling so the strip feels consistent with the showroom grid.

## Out of scope
- No new product schema fields; metadata is derived from existing `materials`/`description`.
- No changes to product detail page, ordering flow, or image upload.

## Verification
- Open `/directory/sharabati/showroom` and confirm cards are shorter, no blank gaps, "View details" appears, and images still load.
- Confirm owner view on `/organizations/sharabati/showroom` shows compact manage controls.
