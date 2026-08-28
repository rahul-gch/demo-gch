# Dashboard redesign + sample products on manufacturer profiles

## Part 1 — Organization dashboard: information and layout

Today the Overview tab is a long vertical stack of full-width cards (hero, AI command center, health score, actions strip, passport, operations, KPIs, missing data, readiness, opportunities, activity). Everything has equal weight, so nothing reads as "what matters now".

**New Overview structure**

```text
+--------------------------------------------------------------+
|  Banner + logo + org identity + primary actions               |
+--------------------------------------------------------------+
|  Readiness score ring  |  4 compact stat tiles (members,      |
|  + band + delta        |  documents, sample orders, messages) |
+--------------------------------------------------------------+
|  LEFT (2/3)                        |  RIGHT (1/3, sticky)     |
|  - Action queue (top 3-5 tasks)    |  - Profile completeness  |
|  - Performance KPI grid            |  - Missing data checklist|
|  - Showroom strip (products)       |  - Recent activity       |
|  - Opportunities                   |                          |
+--------------------------------------------------------------+
```

Concrete changes:
- Two-column grid on desktop (`lg:grid-cols-3`, main span 2, sticky right rail), single column on mobile.
- Merge `HealthScoreCard` + `ReadinessBreakdown` into one compact score card with a ring and three sub-bars, so the score appears once instead of on three tabs.
- Merge `CriticalActionsStrip` + the AI command center's suggestions into a single **Action queue** list: each row = title, why it matters, one button.
- Replace the ad-hoc stat rows with one reusable `StatTile` component so numbers, labels, and units align consistently everywhere.
- Keep every existing tab (Insights, Performance, Network, AI, Documents, Activity) and its contents; only Overview is re-composed. Deduplicated panels stay reachable on their tab.
- Unify visual language: same card radius/border/shadow, consistent section headers (uppercase label + muted hint), tabular numerals for all figures, no new colors outside existing tokens.
- Empty states: a non-seeded org shows a short "add this to raise your score" prompt instead of a zeroed chart.

## Part 2 — Sample products in manufacturer profiles

Showroom exists as its own page. Manufacturer-type orgs (Fabric Mill, Garment Factory, Spinner, Ginner, Dye House, Farmer) should show their products as part of their profile, not only behind a separate tab.

- **Own dashboard Overview**: a "Showroom" strip — horizontal cards of up to 6 products, an "Add product" button when the viewer can edit, and a link to the full showroom. Hidden entirely for non-manufacturer entity types (Brand, Certification Body, Logistics, Sustainability Partner).
- **Public directory profile**: the existing showroom section is promoted higher in the page for manufacturers, directly under the capabilities block, with the "Order sample" action on each card (kept behind the existing connected-partner rule).
- **Onboarding / profile setup**: for manufacturer entity types, add an optional final step "Add your first product" (name, materials, one image) that writes a `showroom_products` row, so new manufacturers do not land on an empty showroom.
- **Product card fields** stay as-is (name, description, images, materials); no schema change needed.

## Technical notes

- New: `src/components/dashboard/StatTile.tsx`, `src/components/dashboard/ScoreCard.tsx` (merged score), `src/components/dashboard/ActionQueue.tsx`, `src/components/showroom/ShowroomStrip.tsx`.
- Edited: `src/routes/_authenticated.organizations.$id.index.tsx` (Overview re-composition only), `HeroPassport.tsx`, `directory/PublicOrgProfile.tsx` (section order), `routes/_authenticated.organizations.$id.profile-setup.tsx` (optional product step).
- A shared `isManufacturer(entityType)` helper in `src/lib/org-types.ts` gates the product surfaces.
- No database migration, no changes to showroom RLS or server functions; the strip reuses `useShowroomProducts`.
