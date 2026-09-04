# Restrict showroom visibility to connected organizations

## What changes

Today any signed-in user can browse another organization's showroom products (only ordering is gated). After this change, a showroom is visible only to:

- members of the organization itself (owners, admins, editors, viewers),
- organizations with an **accepted connection** to it,
- platform admins.

Everyone else sees a **locked teaser** instead of products, and cannot load product data through any URL.

The GCH number formatting question is deliberately left out of this plan (to be discussed later); the 5 brand word-IDs stay as they are.

## User-facing behaviour

**Public profile (`/directory/:id`)** — for non-connected visitors the "Product Showroom & Fabric Swatches" card becomes a compact locked card: lock icon, "Showroom available to connected partners", one line explaining that products and sample requests unlock after connecting, and a **Connect** button (reuses the existing connection-request action; shows "Request pending" if one was already sent). No product count, no "View Full Showroom" link. Connected visitors and members see the card exactly as today.

**Full showroom page (`/directory/:id/showroom`)** — non-connected visitors get the same locked state in place of the search, filters and product grid (with a back link to the profile). The current amber "connect to request samples" banner is removed since it no longer applies.

**Product detail page (`/directory/:id/showroom/:productId`) and order page** — non-connected visitors get a "This product belongs to a partner you are not connected with yet" notice with a link back to the profile, instead of product data.

**Own showroom / internal pages** — unchanged.

## Technical details

### Database (one migration)
- Replace the `showroom_products` read policy `Signed-in users can view active products` (currently `USING (is_active)`) with:
  - `is_active AND (is_platform_admin(auth.uid()) OR EXISTS (SELECT 1 FROM org_members m WHERE m.user_id = auth.uid() AND orgs_are_connected(m.org_id, showroom_products.org_id)))`.
  - `orgs_are_connected` already returns true for the same org, so members remain covered; the existing `Members manage own showroom products` (ALL) policy also stays.
- No changes to `sample_orders` — ordering is already gated by `orgs_are_connected`.

### Server functions (`src/lib/showroom.functions.ts`)
- `listShowroomProducts`: when the viewer is neither a member nor connected (nor platform admin), return `products: []` with `isConnected: false` and a new `locked: true` flag instead of querying. Also drop the "assume connected on failure" defaults (`isConnected = true` fallbacks) so an error never leaks products.
- `getShowroomProduct`: same gate — return `product: null, locked: true` for non-connected viewers.
- Add an `is_platform_admin` check alongside the existing `is_org_member` / `user_can_edit` RPCs so admins keep full visibility.

### UI
- `PublicOrgProfile.tsx`: render the locked teaser card when `showroom.locked` (or `!isConnected && !isOwner`); hide the "View Full Showroom" button in that state.
- `PublicShowroomPage.tsx`: locked state replaces search/filter/grid; remove the amber banner.
- `ProductDetailPage.tsx` (public mode) and `OrderPage.tsx`: handle `locked` / null product with the not-connected notice.
- `use-showroom.ts`: pass through the new `locked` flag in the returned type.

### Verification
- Sign in as a member of an org with **no** connection to Sharabati: profile shows locked card, `/directory/sharabati/showroom` and a product URL show the locked notice, and a direct database read of Sharabati's products returns zero rows.
- Sign in as a connected org (e.g. test org ↔ Sharabati): products, detail page and "Request sample" still work.
- Sign in as Sharabati owner and as a platform admin: full showroom visible.
- Typecheck passes.
