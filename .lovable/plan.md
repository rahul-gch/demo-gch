## Goals

1. Add Nike, Inc. as a real organization populated from the FY24 NIKE Sustainability Data PDF.
2. Add a "Network Passport" hero panel (the dark layout in the screenshot) to every showcase org profile AND to the platform dashboard.
3. Fix the issue where the individual org Dashboard / Profile content isn't visible.

## 1. Add Nike as org `gch-nike`

New file `src/seed/nike.ts` exporting a fully populated `Entity`:

- id `gch-nike`, gchNumber `GCH-NIKE`, name "NIKE, Inc.", entityType `Brand`, actorType `Tier 0`
- HQ: Beaverton, Oregon, USA (lat 45.5106, lng -122.7795)
- Materials: Polyester (recycled), Cotton (organic / BCI), Leather (LWG), Rubber
- Capabilities: Footwear, Apparel, Equipment
- Certifications: bluesign, LWG, Higg FEM, ZDHC, SAC member, Cotton 2025
- Governance / traceability notes pulled from FY24 PDF
- Contacts: Investor Relations + Sustainability (public)
- `profileCompleteness: 96`, `verificationStatus: Verified`, `riskLevel: Low`, readiness all high

`src/seed/entities.ts` is auto-generated, so we won't edit it. Instead append Nike via a small wrapper:

- Add `src/seed/all-entities.ts` exporting `ALL_ENTITIES = [...ENTITIES, NIKE]` and `getEntity(id)`.
- Update `src/seed/showcase.ts`, `src/routes/organizations.$id.tsx`, `src/routes/organizations.tsx`, `src/routes/map.tsx`, `src/routes/matchmaking.tsx`, `src/routes/index.tsx` to import from `all-entities.ts` instead of `entities.ts` directly.
- Add `gch-nike` to `SHOWCASE_IDS` (now 21 showcase orgs).

Hard-code Nike KPI values in `src/seed/kpi/index.ts` `getKpisForEntity` via an override map so KPIs reflect the real FY24 report:

```
KPI001 Scope 1&2 reduction: 69% vs FY20
KPI002 Scope 3 (mfg + transport): 36% vs FY20
KPI003 Recycled material share (polyester): high
KPI010 Renewable electricity (owned/operated): 100%
KPI011 Water reduction (material mfg): 40%
KPI013 Waste diverted from landfill: 100%
```

All marked with confidence "Verified high" and source URL to about.nike.com.

## 2. Network Passport panel

New component `src/components/NetworkPassport.tsx` rendering the dark layout from the screenshot:

- Dark slate background (`bg-slate-950 text-slate-100`), amber accents matching the screenshot (`text-amber-400` headings, amber outlined chips).
- Left/main column: NETWORK PASSPORT title, then a 2-column grid of fields (Organization, Material, Harvest, Fiber length / Entity Type, Origin, Batch size, Certifications chips).
- SUPPLY CHAIN JOURNEY: horizontal stepper with 7 nodes (Farm → Ginning → Spinning → Textile Mill → Manufacturer → Brand → Retail) using lucide icons in amber circles, the current stage highlighted in cyan. Below it, a "current stage" detail card.
- Right column: AI INTELLIGENCE & ESG — six circular score badges (Traceability, Environmental, Social, Governance, Compliance, Trust score) in a 3×2 grid, each showing a 2‑digit number inside an amber ring.
- AI INSIGHTS list: 4 small cards (Supply Risk Alert, Certification Alert, Water Risk, ESG Trend) with lucide icons.

Inputs: an `Entity` plus a `journey` array (Nike gets a curated tier 4→tier 0 path; other showcase orgs get a generated journey using `getEcosystemConnections`).

Wired in two places:

- `src/routes/organizations.$id.tsx` — render `<NetworkPassport e={e} />` at the top of `OrgProfilePage` (above the existing tabs). The existing light-theme tabs stay below for editorial detail.
- `src/routes/index.tsx` — add a "Featured passport" section that rotates through Nike + a couple of other showcase orgs, plus a compact passport summary on the dashboard.

The panel is self-contained dark; the rest of the app stays light. No theme switch.

## 3. Fix "individual org dashboard / profile not visible"

Two probable causes; both addressed:

a. `ShowcaseTabs` only renders for ids in `SHOWCASE_IDS`. Once Nike (`gch-nike`) is added to that array, its tabs (Dashboard, KPIs, Ecosystem…) will appear. Same for any other org the user reports.

b. The Dashboard tab renders `<MiniDashboard entity={e} />` + `<BenchmarkChart …>`. Verify after refactor that both render with entity prop and there are no console errors when switching tabs (will check console + view preview at `/organizations/gch-001` and `/organizations/gch-nike`).

If the visibility bug turns out to be a routing crash (e.g. a missing import after the entities-source refactor), fix it before declaring done.

## 4. Files

- create `src/seed/nike.ts`
- create `src/seed/all-entities.ts`
- create `src/components/NetworkPassport.tsx`
- edit `src/seed/showcase.ts` (use ALL_ENTITIES, add `gch-nike` to SHOWCASE_IDS)
- edit `src/seed/kpi/index.ts` (Nike KPI overrides)
- edit `src/routes/organizations.$id.tsx` (render NetworkPassport, use ALL_ENTITIES)
- edit `src/routes/organizations.tsx`, `src/routes/map.tsx`, `src/routes/matchmaking.tsx`, `src/routes/index.tsx` (use ALL_ENTITIES, add featured passport on dashboard)

## 5. Verification

- Browser-check `/organizations/gch-nike`: passport renders, tabs render, KPI snapshot shows FY24 numbers.
- Browser-check `/organizations/gch-001`: dashboard tab renders MiniDashboard + Benchmark.
- Browser-check `/`: featured passport visible on platform dashboard.
- Console clean.
