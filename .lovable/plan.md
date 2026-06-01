
# Plan — "How It Works" page + Map view

Build one explanatory page that walks through the whole prototype (roles, matchmaking algorithm, messaging, ecosystem graph) and adds a real geographic **map view** of all organisations using the Google Maps connector.

## 1. New route — `/how-it-works`

File: `src/routes/how-it-works.tsx` (own `head()` for SEO).

Sections, in order:

1. **Prototype overview** — what GCH demo is, the 4 personas (Rahul / George / Maria / Admin), and how to switch between them on `/`.
2. **Ecosystem graph** — live embed of `<EcosystemGraph coreOnly />` with a legend explaining node colour (type), node size (S/M/L), ring (high risk), edge colour (supply / verification / partnership), dashed = missing evidence.
3. **Matchmaking algorithm** — explained from `src/lib/matchmaking.ts`:
   - Hard filters: `sameCountryOnly`, `sameRegionOnly`, `minSize`, `maxRisk`, `requiredCerts`.
   - 8 scoring factors with their formulas, pulled from `FACTOR_META`: type fit, tier adjacency, geo proximity, size fit, cert overlap, co-order history, confidence floor, risk penalty.
   - Weighted-sum normalisation → 0–100 score, then thresholds → auto / review / reject.
   - Worked example: score one real pair (e.g. Acme ↔ Northwind) and show the per-factor breakdown via `scorePair()`.
   - **"Parameters we could also consider"** callout (purely informational — not implemented): lead-time, MOQ, price band, payment terms, language, ESG score, capacity utilisation, sanctions list, carbon intensity, on-time delivery, defect rate, IP/data-handling maturity.
4. **Messaging & meetings** — how `gch_comms_v1` works: direct threads between any two participants, unread badges, meeting requests with accept / decline / reschedule. Includes a screenshot-style mini-mockup linking to the Messages button on `/`.
5. **Map view** — embedded `<EcosystemMap />` (see §2).
6. **Tech notes** — localStorage stores, no backend, seeded demo data; one paragraph.

Add a "How it works" link in the header on `src/routes/index.tsx` (next to the Messages button) so users can find the page.

## 2. New component — `src/components/EcosystemMap.tsx`

Geographic map of all `ORGS`, rendered with Google Maps JS API via the existing **Google Maps connector** (`VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`, loaded with `loading=async` + global `initMap` callback, per connector knowledge).

- A hard-coded `COUNTRY_COORDS` map (Portugal, USA, UK, Germany, Japan, Mexico, India, China, Vietnam, Brazil, Netherlands, Belgium, Singapore) gives each org a lat/lng — small jitter per org so co-located orgs don't overlap exactly.
- One `google.maps.Marker` per org, colour-coded by `TYPE_COLOR` (re-export from `EcosystemGraph`).
- Click marker → `InfoWindow` with org name, type, country, tier, size, confidence, risk, status, top 3 matches (`topMatches(orgId, loadSettings(), 3)`), and a "View details" button.
- Legend overlay (type colours) in a corner.
- Loading + error states; if connector key is missing, show an inline notice with a "Connect Google Maps" hint instead of crashing.

If the Google Maps connector is not yet linked to this project, call `standard_connectors--connect` for `google_maps` before writing the map code.

## 3. Map view on `/` (dashboard)

In `src/routes/index.tsx`, add a small **view toggle** above the existing ecosystem graph in the admin dashboard: `Graph | Map`. Map mode renders `<EcosystemMap />` in the same panel; graph mode keeps current behaviour. Clicking a marker selects that org (same `onSelect` contract as the graph) so the existing detail drawer logic still works.

No other behaviour changes.

## Files

- **Create:** `src/routes/how-it-works.tsx`, `src/components/EcosystemMap.tsx`
- **Modify:** `src/routes/index.tsx` (header link + Graph/Map toggle in admin view)

## Out of scope

- Custom map tiles / Mapbox.
- Real geocoding (we use the hard-coded country centroids — accurate enough for a demo).
- Editing matchmaking logic itself; this page only explains what's already in `matchmaking.ts`.
