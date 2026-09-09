# Multiple product photos + default vs one-off delivery address

## 1. Upload several product photos at once

Today the "Add product" / "Edit product" window lets you pick only one photo per click, so adding five photos means five separate trips through the file picker.

Changes in the product editor:
- The file picker accepts many photos in one selection (and drag-and-drop onto the upload area).
- Selected photos upload one after another with a small "Uploading 2 of 5…" indicator; each finished photo appears immediately in the grid.
- Per-file checks stay as they are (images only, max 5MB each); an invalid or failed file is skipped with a short message naming it, and the rest still upload.
- A cap of 10 photos per product, with the first one still marked as the cover; existing reorder/remove controls are unchanged.

## 2. Default delivery address, with a one-off alternative

Both places where a sample is requested — the single-product "Request a sample" page and the cart checkout window — will:
- Prefill the delivery address from the buying organization's saved profile address (company name, street, city, postal code, country), shown read-only in a "Default address" card with a note where it comes from.
- Offer a "Ship to a different address" button that reveals an empty address box for that one request only. A "Use default address" link switches back.
- Never overwrite the organization's saved address. The typed address is stored only on that sample order, exactly as today.
- If the organization has no saved address yet, the box starts empty and editable, with a hint that the address can be saved once in organization settings.
- Switching the "Ordering as" organization reloads that organization's default address.

## Technical notes

- New authenticated server function `getOrgShippingDefault` in `src/lib/orgs.functions.ts` (or a small `shipping` section there): takes an org id, verifies membership via the existing authenticated client, returns `{ name, address, city, zipCode, country, formatted }` built from `public.orgs`. No schema change, no new table.
- New hook in `src/lib/use-comms.ts` (or `use-showroom.ts`) wrapping it with React Query, keyed by org id, enabled only with a ready session.
- New shared component `src/components/showroom/ShippingAddressField.tsx` holding the default/custom toggle, used by `OrderPage.tsx` and `SampleCartCheckoutDialog.tsx`. Submit logic still sends `shippingAddress` as a plain string, so `showroom.functions.ts` and the orders schema are untouched.
- `ProductEditorDialog.tsx`: `multiple` on the file input, sequential upload loop reusing the existing `SHOWROOM_BUCKET` upload + `makeRef` + preview resolution, with counter state.

## Verification

- Add a product, select 4 photos in one go: all four appear, first is the cover, saving keeps all four.
- Order a sample as an organization with a saved address: the address is prefilled; submit works.
- Use "Ship to a different address", submit, then reopen organization settings: the saved profile address is unchanged, and the order shows the one-off address.
- Repeat the same two checks in the cart checkout window.
