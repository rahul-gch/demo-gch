# Showroom: product pages, cleaner publishing, end-to-end orders

## What you get

1. **Full product detail page** — clicking any product card opens a dedicated page with a large image gallery, full description, material specs, publish status, and the ordering action. Works both inside your own workspace and on a partner's public profile, so a connected organization can open the full product page.
2. **Sample products for rahul gmbh** — a small catalogue of apparel products with images and material tags, so the flow can be tested immediately.
3. **Cleaner add/edit product form** — reorganized into clear sections (Basics, Images, Materials, Availability) with drag-free image reordering, a cover-image marker, inline validation, and clearer upload feedback.
4. **Publish controls** — each product has an explicit Published / Hidden state, togglable directly from the card and the detail page (not only buried in the edit form). Hidden products stay visible to the owner marked "Hidden", and are invisible to everyone else.
5. **Delete** — confirm-dialog delete stays, exposed on both the card and the detail page.
6. **End-to-end order flow** — a connected organization places a sample order from the product page; the order lands in the seller's Sample Orders inbox with statuses (Requested → Accepted/Declined → Shipped → Delivered), a linked message thread, and status visible to the buyer in their outbound list.
7. **Leave Organization removed for owners** — owners no longer see or can trigger the leave action; non-owner members keep it.

## Technical detail

- **New route** `src/routes/_authenticated.organizations.$id.showroom.$productId.tsx` rendering a new `ProductDetailPage` component; `ProductCard` links to it. Route `head()` gets a product-specific title/description.
- **Server**: add `getShowroomProduct` to `src/lib/showroom.functions.ts` (auth-required, returns product + `isOwner` / `canManage` / `isConnected` flags, 404 when hidden and caller is not a member). Add `setShowroomProductActive` for the publish toggle. Hooks added to `src/lib/use-showroom.ts` via `useServerFn`.
- **Visibility**: existing RLS already allows signed-in users to view active products and restricts ordering to connected orgs (`orgs_are_connected`); hidden products remain owner-only. No policy change expected — verified against current policies before edit.
- **Editor**: refactor `ProductEditorDialog.tsx` into sectioned layout, keep the same `onSave` contract and Supabase storage upload path (`SHOWROOM_BUCKET`).
- **Orders**: reuse `createSampleOrder` / `listSampleOrders` / `updateSampleOrderStatus`; surface the buyer-side status in `SampleOrdersPanel` outbound tab and add the order CTA to the detail page.
- **Seed data**: one migration inserting rahul gmbh (`23742c82-…`) products into `showroom_products` with image URLs and materials.
- **Members panel**: in `src/components/settings/MembersPanel.tsx`, hide the Leave Organization card when the current user's role is `owner` (server-side guard in `leaveOrganizationFn` already blocks sole owners; add an owner-level guard there too).
