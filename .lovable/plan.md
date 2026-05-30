
## Goal
Make the ecosystem graph readable and clean by showing only a focused core subset (6 nodes) with smaller, better-spaced nodes and clearer labels.

## Changes

### 1. `src/components/EcosystemGraph.tsx`
- Add a `coreOnly` prop (default `true` for the overview tab) that filters to a curated set of 6 anchor orgs:
  - `acme` (brand), `lumon` (brand), `northwind` (supplier T2), `tyrell` (supplier T2), `starkv` (verifier), `ngo1` (regulator).
- Reduce node radius significantly:
  - `SIZE_R` → `{ S: 1.4, M: 1.9, L: 2.4 }` (was 2.2 / 3.2 / 4.2).
  - Inner core dot reduced proportionally; glow blur reduced (`stdDeviation 0.35`).
- Rebalance layout coordinates for the 6 core nodes into a clean hex/pentagon spread so labels don't collide:
  - acme (50,52), lumon (24,38), northwind (40,30), tyrell (66,32), starkv (72,60), ngo1 (44,76).
- Labels:
  - Smaller font (`1.4`), softer color (`#cbd5e1`), placed below with consistent offset.
  - Add subtle text shadow via a `<filter>` so labels remain readable over edges.
- Edges:
  - Thinner strokes (`0.12 + strength*0.3`), lower opacity baseline.
  - Only render edges where both endpoints are in the visible set (already the case).
- Keep risk halo + selected ring, but scaled down.

### 2. `src/routes/index.tsx` (admin overview only)
- Pass `coreOnly` to `<EcosystemGraph />` in the admin Overview tab.
- Add a small toggle above the graph: "Core view (6) / Full ecosystem (18)" so admin can expand when needed.
- No data changes — `ORGS`/`EDGES` in `ecosystem-data.ts` stay intact; the full graph remains available via the toggle.

### Out of scope
- No backend changes, no new orgs, no auth changes, no matchmaking algorithm changes.

## Result
Default admin Overview shows a calm 6-node graph with small nodes, breathing room, and readable labels matching the dark theme. Toggle expands to the full 18-node ecosystem when needed.
