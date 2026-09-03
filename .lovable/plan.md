# Showroom fixes: connection gate, back-button loop, Request sample CTA

## 1. rahul gmbh could order from Sharabati without being connected

**Confirmed cause (from the database):** the `orgs_are_connected` check that gates sample ordering treats any of the following as "connected": an accepted connection request, **a shared message conversation**, or a shared project. rahul gmbh and Sharabati have no accepted connection request, but they share a conversation (created earlier for testing), so the order gate let it through. The product page also showed "Order sample" instead of "Connect to order samples" for the same reason.

**Fix**
- Change `orgs_are_connected` so only an **accepted connection request** (`org_connections.status = 'accepted'`) counts. Shared conversations and shared projects will no longer unlock ordering. This matches what the Connections UI already shows.
- Existing orders placed under the old rule stay as they are (one open "requested" order from rahul gmbh to Sharabati); Sharabati can decline it from its inbox.

## 2. Back button loops between public profile and showroom

**Cause:** the "Back" button in the public profile header calls browser history back, while the showroom page's "Back to {org}" is a normal link that pushes a new history entry. Profile → Showroom → "Back to org" → "Back" → Showroom → … loops forever.

**Fix**
- The public profile's header "Back" becomes a deterministic link to the user's home (`/`, which lands on their own organization dashboard / admin list) instead of history back.
- Showroom, product page and order page keep their existing "Back to …" links (they already go to a fixed parent), so the chain is always Product → Showroom → Profile → Home.

## 3. Product page CTA

- Rename "Order sample" to **"Request sample"** (product page, product card "Order Sample", order page heading "Request a sample" and submit button "Send sample request", success toast wording).
- Move the request card out of the top of the detail column: it renders **at the bottom of the right column, below Specifications**, right-aligned (button sized to content, not full width), with the small helper text under it. The "Connect to request samples" state uses the same placement.

## Technical details

- Migration: `CREATE OR REPLACE FUNCTION public.orgs_are_connected(uuid, uuid)` keeping `_org_a = _org_b OR EXISTS (accepted org_connections either direction)` only.
- `src/components/directory/PublicOrgProfile.tsx` line ~170: replace `onClick={() => router.history.back()}` with `<Button asChild><Link to="/">`.
- `src/components/showroom/ProductDetailPage.tsx`: move `{actionCard}` from after the title block to after the Specifications section inside the details column; restyle as a right-aligned block (`flex justify-end`, `Button` without `w-full`).
- Label updates in `ProductDetailPage.tsx`, `ProductCard.tsx`, `OrderPage.tsx`, `PublicShowroomPage.tsx` copy.
- Verify: as rahul gmbh member, Sharabati product page shows "Connect to request samples" and the order route refuses; back button from profile lands on home; typecheck passes.
