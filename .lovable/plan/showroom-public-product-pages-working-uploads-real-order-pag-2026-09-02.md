# Showroom: public product pages, working uploads, real order pages with quotes

## What I found

- **"Missing" xyz order** — the order placed today for rahul gmbh was submitted by the *test org* account (rahultest@gmail.com), not xyz, so it correctly sits in test org's Outbound list. xyz has never placed an order. The new order page will show "Ordering as: <org>" up front and confirm with a direct link to the outbound list, so this can't be confusing again.
- **Image upload fails** because the `showroom` storage bucket does not exist in the backend (only org-banners, org-docs, org-logos and reports do). The upload code and image-ref resolver already target it.
- **"View Full Showroom" and product pages don't open for connected orgs** because those links point to the internal workspace (`/organizations/<org>/showroom`), which redirects non-members back to the public profile. There is no public showroom or product route. Product cards on the public profile also aren't linked at all.

## What you get

1. **Public showroom & product pages** — connected (or any signed-in) organizations open a partner's full showroom at `/directory/<org>/showroom` and any product at `/directory/<org>/showroom/<product>`. Same gallery/spec layout as the owner view; hidden products stay owner-only; ordering requires a connection.
2. **Image upload fixed** — the `showroom` bucket is created (private, 5 MB, images only) with access rules so members can upload and any signed-in user can view via signed URLs.
3. **Real order page instead of a popup** — placing an order opens a dedicated page (`/directory/<org>/showroom/<product>/order`) with: "Ordering as" org selector (when you belong to several orgs), quantity stepper, material/colorway, needed-by date, shipping address, notes, and a summary column. Submitting lands you on the order detail page.
4. **Order detail page with status timeline** — `/organizations/<your-org>/showroom/orders/<order>` shows product, both parties, quantities, a vertical timeline (Requested → Quoted → Confirmed → Shipped → Delivered, plus Declined/Withdrawn), the quote, and the linked chat. Buyer and seller both open the same page from their Inbound/Outbound lists.
5. **Seller quotes after request (no payments)** — seller responds to a request with a quote: sample price, currency, shipping cost, lead time, note. Buyer sees "Quoted" and confirms or withdraws. Seller then marks Shipped (with tracking) and Delivered. Every step posts a short message in the shared conversation and a notification. No card payment / Stripe.
6. **Outbound list clarity** — outbound cards show status, quote amount, "Ordered as" org, and a "View order" button.

## Technical detail

**Database (one migration)**
- `sample_orders`: add `quoted_price numeric`, `quote_currency text default 'EUR'`, `shipping_cost numeric`, `lead_time_days int`, `quote_note text`, `quoted_at`, `confirmed_at`, `shipped_at`, `delivered_at timestamptz`, `tracking_ref text`. Status values become `requested | quoted | confirmed | declined | withdrawn | shipped | delivered` (existing `accepted`/`completed` rows are mapped to `confirmed`/`delivered`).
- New `sample_order_events` table (order_id, actor_org_id, actor_user_id, from_status, to_status, note, created_at) with GRANTs + RLS (buyer/seller members read; inserts only through the server function). Powers the timeline.
- Storage: policies on `storage.objects` for bucket `showroom` (members of the org in the path prefix can insert/update/delete; signed-in users can select). Bucket itself created with the storage tool (private, 5 MB, image mime types).

**Routes (new files)**
- `src/routes/_authenticated.directory.$id.showroom.index.tsx` — public showroom (reuses `ShowroomWorkspace` in read-only mode, no Orders tab).
- `src/routes/_authenticated.directory.$id.showroom.$productId.index.tsx` — public product page (reuses `ProductDetailPage`).
- `src/routes/_authenticated.directory.$id.showroom.$productId.order.tsx` — order page.
- `src/routes/_authenticated.organizations.$id.showroom.orders.$orderId.tsx` — order detail/timeline page (member-only).
- `_authenticated.directory.$id.tsx` becomes a layout with `<Outlet />`; the current profile moves to `_authenticated.directory.$id.index.tsx`. Each route gets its own `head()`.

**Links**
- `PublicOrgProfile`: "View Full Showroom" → `/directory/$id/showroom`; `ProductCard` gets a `detailTo` prop so cards link to the directory product route when not owner.
- `ShowroomStrip`, `ProductCard`, `ProductDetailPage`: choose organizations vs directory route based on `isOwner`.
- `ProductDetailPage` "Order sample" → navigates to the order route instead of opening `SampleOrderDialog` (dialog kept for the in-workspace card button, also switched to navigate).

**Server (`src/lib/showroom.functions.ts`)**
- `createSampleOrder`: validate buyer membership via `is_org_member` server-side (never trust the posted buyer id), insert order + first event, return order id.
- New `getSampleOrder(orderId, orgId)` with product, both orgs, events.
- `updateSampleOrderStatus` → replaced by `transitionSampleOrder` enforcing allowed transitions per role (seller: quote/decline/ship/deliver; buyer: confirm/withdraw), writing quote fields, inserting an event, posting a chat message.
- New `useSampleOrder`, `useTransitionSampleOrder` hooks in `use-showroom.ts`; `useCreateSampleOrder` accepts the selected buyer org.
- Remove the in-memory `FALLBACK_SAMPLE_ORDERS` path; all orders are DB rows.

**UI components**
- New `OrderPage.tsx`, `OrderDetailPage.tsx`, `OrderTimeline.tsx`, `QuoteDialog.tsx` under `src/components/showroom/`.
- `SampleOrdersPanel`: status badges for the new states, quote amount, "View order" link, seller "Send quote" action, buyer "Confirm quote" action.

**Verification**
- Sign in as the xyz account, open rahul gmbh's public profile → showroom → product → place order → confirm it appears in xyz Outbound and rahul gmbh Inbound; quote from rahul gmbh; confirm from xyz; ship/deliver. Upload an image on a rahul gmbh product and confirm it renders on the public product page.
