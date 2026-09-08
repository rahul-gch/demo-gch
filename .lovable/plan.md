# Default shipping address when ordering samples

Today both sample order forms (single product and the multi-fabric cart checkout) start with an empty shipping box, so buyers retype their address every time.

## What changes

1. **Address loads automatically**
   When you open a sample order form, the delivery address is pre-filled from the address saved on the organization you are ordering as (company name, street, postcode, city, country). It shows as a selected "Default address" card with a Change option.

2. **Ship to another address**
   A "Ship to a different address" button switches to an editable box for a one-off destination. A "Use default address" link switches back. If your organization has no address saved yet, the form opens straight in the editable box with a small hint that saving it once makes it the default.

3. **Save as new default**
   When a custom address is entered, a checkbox "Save this as our default shipping address" writes it back to the organization profile after the order is placed. The checkbox only appears for people allowed to edit the organization profile (owners and admins); everyone else can still ship to a custom address for that order.

4. **Switching organizations**
   If you change the "Ordering as" organization in the cart checkout, the default address reloads for that organization.

Nothing else about ordering, pricing, quoting or navigation changes.

## Technical notes

- Add an authenticated server function `getOrgShippingDefaults` in `src/lib/orgs.functions.ts` returning `{ name, address, city, zipCode, country, canEdit }` for a given org id, scoped to org members (reuse the existing membership check; `canEdit` via `user_can_edit`). No new table or column — reuse `orgs.name/address/city/zip_code/country`.
- Add a small hook (`useOrgShippingDefaults(orgId)`) in `src/lib/use-comms.ts` or a new `src/lib/use-shipping.ts` using React Query.
- New shared component `src/components/showroom/ShippingAddressField.tsx` holding the default/custom toggle, formatted default card, textarea, and save-as-default checkbox; it exposes the resolved address string plus a `saveAsDefault` flag.
- Use it in `src/components/showroom/OrderPage.tsx` and `src/components/showroom/SampleCartCheckoutDialog.tsx`, replacing the current `address` textarea state; submit validation stays the same (min 3 chars).
- When `saveAsDefault` is checked, after a successful order call the existing `updateOrgProfile` server function with the parsed address fields (address line kept as free text in `address`, rest untouched unless provided). Failure to save the default shows a warning toast but does not fail the order.
