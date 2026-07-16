## Goal

Make **Ecosystem network** and **Supply chain snapshot** cards on the org dashboard more readable, professional, and interactive with expandable drill-downs.

## Issues today

- Ecosystem network: metric labels overlap ("ORGANIZATIONS/COUNTRIES" collide at 7 columns), flat white boxes, no way to see who's behind each number without leaving the page.
- Supply chain snapshot: tier bars invisible (values ~2 render as slivers), colored tiles are pale/washed, no drill-down.

## Changes

### 1. `src/components/dashboard/EcosystemSummary.tsx`
- Replace flat `Cell` with **clickable pill-buttons**: icon + label + count, colored per category (Organizations/Countries/Suppliers/Research/NGOs/Auditors/Certifiers), hover ring, `aria-expanded` state.
- Fix label collisions: 2 cols mobile → 3 sm → 4 md → 7 xl, with `min-w-0` + tighter label size + `truncate`.
- Add **expand panel** below the metric row: clicking a pill toggles a panel listing matching connections (name, country, entity type) as compact rows linking to the org profile. Second click collapses. Only one open at a time.
- Keep the map beneath; add subtle section divider.

### 2. `src/components/dashboard/SupplyChainSnapshot.tsx`
- Upgrade the 5 stat tiles: stronger borders, icon per tile (Users/Globe/AlertTriangle/Clock/BadgeCheck), consistent typography, clickable to expand.
- Fix **Tier distribution** bars: use `min-height` (e.g. `max(8%, computed%)`) so small values remain visible; add value label on top of each bar; add tier legend line.
- Add **expand panel**: clicking Suppliers/Risks/Delays/Certified reveals a filtered list (suppliers grouped by tier, risks show flagged connections, certified shows verified ones). Countries expand shows country chips with counts.
- Add a small "View full supply chain" link to `/organizations/$id/supply-chain`.

### 3. Shared behavior
- Expand animation: simple `data-state` open/close with `max-h` transition (no new deps).
- Both cards use the same `ExpandablePill` pattern for consistency.
- No changes to routing, seed, or data derivation (`dashboard-derive.ts` already returns enough data; we'll read `getEcosystemConnections(entity)` in each component for the lists).

## Files touched

- `src/components/dashboard/EcosystemSummary.tsx` (rewrite render)
- `src/components/dashboard/SupplyChainSnapshot.tsx` (rewrite render)

No new packages, no route changes, no backend changes.
