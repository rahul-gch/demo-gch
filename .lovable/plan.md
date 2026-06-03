
## Goal

1. Replace the broken/mock map with a **real Google Maps** view (using the existing Google Maps connector) on both the **Map View** route and the **Dashboard**, styled like the dark reference screenshot.
2. Build out **complete profile pages** for the first 20 seeded orgs (`gch-001`…`gch-020`) with Dashboard, Ecosystem, Matchmaking, Messages, Documents, Activity — all wired into a tabbed profile layout.

---

## 1. Google Maps integration

**Component:** new `src/components/EcosystemGoogleMap.tsx`
- Loads Maps JS API via `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` with `loading=async&callback=initMap&channel=…` (per Google Maps connector rules).
- Uses `google.maps.Map` (no `mapId`, no `AdvancedMarkerElement`) with a **dark style JSON** matching the screenshot (deep navy land, muted labels).
- Renders one `google.maps.Marker` per entity, color-coded by `EcosystemGroup`:
  - Brand → amber `#f59e0b`
  - Supplier → cyan `#22d3ee`
  - Verifier → green `#22c55e`
  - Regulator → purple `#a855f7`
- Hover/click → `InfoWindow` with name, type, country, and a "View profile" link.
- Props: `entities`, `height`, `onSelect`, `selectedId`, `compact`, `showLegend`.
- Legend overlay (bottom-left) and zoom controls preserved.

**Wiring:**
- `src/routes/map.tsx` → replace `MockWorldMap` with `EcosystemGoogleMap`, keep filters & side panel.
- `src/routes/index.tsx` → replace dashboard map preview with `EcosystemGoogleMap` (compact, 280px, no legend).
- Delete `src/components/MockWorldMap.tsx`.

**Note on Leaflet plan:** the previously approved Leaflet plan is superseded by this request — we will use Google Maps instead and will NOT install leaflet/react-leaflet.

---

## 2. Complete profile for first 20 orgs

**Route:** rewrite `src/routes/organizations.$id.tsx` for showcase entities into a **tabbed profile** using shadcn `Tabs`:

```text
┌─ Header: logo block, name, GCH#, type chips, country, missing-data summary, action buttons
├─ Tabs:
│   • Overview     – company description, contacts, address, governance, traceability notes
│   • Dashboard    – MiniDashboard (KPIs, sparkline, monthly volume, material mix)
│   • Ecosystem    – upstream/downstream connections (derived from seed), mini Google Map
│                    centered on this entity with nearby connected orgs
│   • Matchmaking  – top suggested matches list (deterministic from seed), match score,
│                    "Open match" action
│   • Messages     – existing MessageChannel
│   • Documents    – existing DocumentsList
│   • Activity     – existing ActivityFeed
│   • Missing data – checklist of missing fields with "Request from org" stub
```

**New helpers in `src/seed/showcase.ts`:**
- `getEcosystemConnections(e)` – deterministically pick 3–6 related orgs by tier/material overlap.
- `getMatchSuggestions(e)` – deterministic top 5 with score 60–95%.

**New components:**
- `src/components/EcosystemConnections.tsx` – grouped list (Upstream / Downstream / Verifiers).
- `src/components/MatchmakingPanel.tsx` – ranked match cards with score bars.

**Non-showcase entities (21+):** keep the existing "Lite profile" banner — unchanged.

---

## 3. Technical notes

- Google Maps connector is already linked; only the browser key (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`) is needed — no server calls.
- Script loader uses a single global `window.initMap` guard so multiple map instances on one page (dashboard preview + side panels) share one API load.
- Marker icons use inline SVG data URLs so colors stay in sync with design tokens.
- No DB / server changes. Purely frontend.

---

## Files

**Create**
- `src/components/EcosystemGoogleMap.tsx`
- `src/components/EcosystemConnections.tsx`
- `src/components/MatchmakingPanel.tsx`

**Update**
- `src/routes/map.tsx` (swap map component)
- `src/routes/index.tsx` (swap map component)
- `src/routes/organizations.$id.tsx` (tabbed profile for showcase)
- `src/seed/showcase.ts` (add connection + match helpers)

**Delete**
- `src/components/MockWorldMap.tsx`
