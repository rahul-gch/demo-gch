## Goal
Replace the "Coming soon" Supply Chain Mapping page with a real workspace that has three sections: (1) Excel upload for an existing supply chain, (2) a map view of the current chain, and (3) AI-recommended supply chain suggestions.

## Page structure (`src/routes/organizations.$id.supply-chain.tsx`)
Drop `ComingSoon` and render a new `<SupplyChainPage entity={entity} />`. Header: "Supply chain mapping" + short subtitle. Below it, three sections in this order.

### 1. Upload existing supply chain (Excel)
Card at the top with:
- Drag-and-drop area + "Upload .xlsx / .csv" button (accept=".xlsx,.xls,.csv"). Uploads to the existing private `reports` bucket under `<entity.id>/supply-chain/` (reusing `supabase.storage`).
- Downloadable template link ("Download template") — served from `/supply-chain-template.csv` in `public/` with columns: `tier, company_name, country, city, role, materials, certifications, contact_email`.
- List of previously uploaded chain files with filename, size, uploaded date, and delete button (same pattern as `ReportUploader`).
- After a successful upload, show a toast "Chain imported — 24 rows detected" (row count = simple client-side CSV line count; xlsx just shows filename since we won't parse xlsx in the browser).
- Sign-in gating identical to `ReportUploader`.

### 2. Map view of current supply chain
Card titled "Current supply chain map". Reuse existing `EcosystemGoogleMap` component to plot the org + its ecosystem connections (upstream/downstream/verifiers from `getEcosystemConnections(entity)`), so we get a real Google-Maps view without adding new infra. Add:
- Legend chips: Tier 0 / Tier 1 / Tier 2 / Tier 3 / Tier 4 with distinct colors.
- Small stats strip beside the map: total nodes, countries, upstream count, downstream count.
- Fallback: if `getEcosystemConnections` returns nothing, show a small empty state pointing to the upload above.

### 3. Recommended supply chain
Card titled "Recommended partners for this chain". For each gap tier the org is missing, suggest 2-3 partners by scoring candidates from `ALL_ENTITIES` using the existing `getMatchesFor(entity)` helper (already used by matchmaking) but grouped by tier. Layout:
- Tier accordion / grouped list. Each candidate row shows: name, country, entity type badge, top 2 match reasons (dots), score bar, and two buttons — "Add to chain" (local toast for now: "Added to chain draft") and "View profile" (opens `MatchProfileSheet`, already used on matchmaking).
- Header row action: "Regenerate suggestions" (re-runs the seed-based scoring; deterministic so it just re-mounts the list).

## New files
- `src/components/supply-chain/SupplyChainPage.tsx` — composes the three sections.
- `src/components/supply-chain/ChainUploader.tsx` — Excel/CSV uploader, list, delete, template link.
- `src/components/supply-chain/ChainMap.tsx` — wraps `EcosystemGoogleMap` with legend + stats.
- `src/components/supply-chain/RecommendedChain.tsx` — grouped recommendation list reusing `getMatchesFor` and `MatchProfileSheet`.
- `public/supply-chain-template.csv` — template with the header row noted above and 2 example rows.

## Route changes
- `src/routes/organizations.$id.supply-chain.tsx`: drop `ComingSoon`, render `<SupplyChainPage entity={entity} />`, update head description to "Upload, visualize and extend the supplier network."

## Out of scope
- No server-side parsing of the uploaded Excel/CSV; the file is stored as-is in the existing `reports` bucket.
- No backend schema changes, no new storage bucket, no new server functions.
- No changes to matchmaking, feed, compliance, or other pages.
- No new Google Maps API key — reuses the existing `GOOGLE_MAPS_BROWSER_KEY` already wired into `EcosystemGoogleMap`.
