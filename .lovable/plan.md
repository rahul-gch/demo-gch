# Showroom + cleaner dashboard overview

## 1. Hide two panels from the org Overview

On the organization dashboard, the Overview tab currently repeats "Ecosystem network" and "Supply chain snapshot". Remove both from Overview only — they stay available on the **Network** tab, so nothing is lost.

## 2. New feature: Showroom

A product catalogue per organization, with sample ordering.

**Product (minimal fields)**
- Name, description, images, materials

**Who sees what**
- The owning organization manages its own products (add / edit / delete).
- Other organizations see the showroom only if they are a **connected partner** — i.e. they already share a conversation or a project with the owning org.
- Non-connected orgs see the Showroom tab with a short "Connect first" note and a "Send message" action.

**Sample order flow**
1. A connected partner opens a product and clicks **Order sample**.
2. Form: quantity, chosen material, colour/notes, shipping address, needed-by date.
3. Request is created with status `requested`, and a conversation between the two orgs is auto-created (or reused) with a first message summarising the request, so the discussion lives in Messages.
4. Seller sees an **Inbound** tab, buyer an **Outbound** tab, with actions: Accept, Decline, Mark shipped, Mark delivered; buyer can Withdraw while still pending.
5. Both parties get a notification; counts feed the existing Messages/Requests badges.

**Where it lives**
- New "Showroom" entry in the organization sidebar → `/organizations/$id/showroom`, with two tabs: *Products* and *Sample orders*.
- New "Showroom" section on the public directory profile (`/directory/$id`) so partners can browse and order from there.

## Technical notes

Database (migration, with GRANTs + RLS in the same migration):
- `showroom_products`: `id`, `org_id`, `name`, `description`, `images jsonb`, `materials text[]`, `is_active`, timestamps.
- `sample_orders`: `id`, `product_id`, `seller_org_id`, `buyer_org_id`, `requested_by`, `quantity`, `material`, `notes`, `shipping_address`, `needed_by`, `status`, `conversation_id`, timestamps.
- Helper `public.orgs_are_connected(_org_a uuid, _org_b uuid)` (security definer): true when the two orgs share a `conversation_participants` conversation or a project (owner/partner). Used by RLS.
- Product SELECT: members of `org_id`, or members of an org connected to it. INSERT/UPDATE/DELETE: `user_can_edit(auth.uid(), org_id)`.
- Sample order SELECT: members of buyer or seller org. INSERT: member of buyer org and connected. UPDATE: seller for status transitions, buyer for withdraw.
- Product images uploaded to a new private `showroom` storage bucket, read through signed URLs like the existing branding/report uploads.

Code:
- `src/lib/showroom.functions.ts` — `listProducts`, `upsertProduct`, `deleteProduct`, `createSampleOrder` (calls `get_or_create_conversation` + `sendMessage` logic), `listSampleOrders`, `updateSampleOrderStatus`; all under `requireSupabaseAuth`.
- `src/lib/use-showroom.ts` — React Query hooks.
- `src/components/showroom/` — `ShowroomWorkspace.tsx`, `ProductCard.tsx`, `ProductEditorDialog.tsx`, `SampleOrderDialog.tsx`, `SampleOrdersPanel.tsx`.
- Route `src/routes/_authenticated.organizations.$id.showroom.tsx`; sidebar item in `OrgSidebar.tsx`; showroom section added to `PublicOrgProfile.tsx`.
- Overview change: drop `EcosystemSummary` and `SupplyChainSnapshot` from `OverviewMissionControl` in `src/routes/_authenticated.organizations.$id.index.tsx`.

No dummy data is seeded — every showroom starts empty.
