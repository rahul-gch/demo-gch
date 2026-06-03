## Goals

1. The map currently shows no organizations — replace the Google Maps embed with the previous styled mock world map (same look as before), and group pins by country/region.
2. For the first 20 seeded entities, build a fuller "organization profile" experience: detailed profile, mini dashboard with KPI widgets, and an internal messaging channel UI (prototype only, no real backend).
3. For the remaining 169 entities, keep the existing lighter profile so registry/filters still work.

Out of scope: real backend, auth, real messaging, real map tiles, AI extraction.

---

## 1. Fix the Map — revert to styled mock world map

**Why nothing renders today:** the Google Maps browser key is referrer-restricted and the current preview domain is being blocked, so the map div stays empty. Rather than wrestle with that, go back to the SVG-based `MockWorldMap` look from the earlier iteration — same premium aesthetic, deterministic, no API key needed.

**Changes:**
- Use `src/components/MockWorldMap.tsx` (already in repo) as the base, but upgrade it:
  - SVG world outline (neutral slate fill, soft border).
  - Equirectangular projection of `latitude` / `longitude` → x/y.
  - Pins colored by `verificationStatus` (Verified / Pending / Incomplete / Flagged).
  - Hover tooltip with name + country.
  - Click pin → calls `onSelect(entity)`.
  - Selected pin gets a ring + larger radius.
- **Regions overlay:** group entities by `country`; render a faint translucent cluster bubble per country with the entity count (e.g. "India · 42", "Bangladesh · 31"). Bubble center = average lat/lng of that country's pins; radius scales with count. This gives the "regions based on address/country" the user asked for.
- Add a side legend: status colors + top 6 countries with counts.
- Replace `<GoogleMap />` usages on:
  - `/` (Dashboard map preview)
  - `/map` (full map view + side panel — keep existing filters and detail card)
  - `/organizations/$id` (single-pin mini map on profile)
- Delete `src/components/GoogleMap.tsx` (no longer used).

---

## 2. Rich profiles for the first 20 entities

The first 20 entities in `src/seed/entities.ts` (gch-001 … gch-020) become "showcase" profiles. Mark them with a `showcase: true` flag in seed data (extend `Entity` type) so the profile route can branch.

**On `/organizations/$id` for showcase entities, add three new sections under the existing header:**

### a. Mini Dashboard (KPI widgets)
A 4-card grid:
- **Profile Completeness** — big % + progress bar.
- **Confidence Score** — % + delta vs registry average.
- **Active Orders (mock)** — number + small sparkline (static SVG path from seeded values).
- **On-time Delivery (mock)** — % + trend arrow.

Below: two-column charts (static SVG / CSS bars, no chart lib needed):
- Monthly volume (last 6 months, mocked per entity).
- Material mix (horizontal bars from `materials[]`).

### b. Internal Message Channel (prototype UI only)
- Channel header: entity name + "GCH Platform ↔ {entity}".
- Thread of 4–6 seeded messages (mix of admin + entity replies) with avatars, timestamps, read receipts.
- Disabled composer at bottom (`<Textarea disabled placeholder="Messaging is read-only in this prototype" />` + Send button).
- Seed messages live in `src/seed/messages.ts` keyed by entity id.

### c. Activity & Documents
- Recent activity feed (5 events: "Certification uploaded", "Profile reviewed", "Score updated", etc.) seeded per entity.
- Documents list (mock filenames: `GOTS_Certificate_2026.pdf`, `Factory_Audit.pdf`, etc.) — list rows with file icon + status badge, no real download.

**Seed data additions:**
- Extend `src/seed/types.ts`: `showcase?: boolean`, optional `mockKpis`, `mockMessages`, `mockActivity`, `mockDocuments` (or keep them in separate seed files keyed by entity id).
- Create `src/seed/showcase.ts` that maps the 20 ids → mock dashboards/messages/activity/documents. Generated deterministically from each entity's existing fields so numbers feel coherent (e.g. brand vs factory differ).

**Non-showcase entities (gch-021 … gch-189):** keep current profile as-is. Add a small banner "Lite profile — full dashboard not enabled for this entity in the prototype."

---

## 3. Files

**Edit:**
- `src/components/MockWorldMap.tsx` — upgrade with regions, legend, selection.
- `src/routes/index.tsx` — swap GoogleMap → MockWorldMap.
- `src/routes/map.tsx` — swap GoogleMap → MockWorldMap, keep filters/side panel.
- `src/routes/organizations.$id.tsx` — single-pin mini map + new sections for showcase entities.
- `src/seed/types.ts` — add showcase + mock fields.
- `src/seed/entities.ts` — mark first 20 with `showcase: true`.

**Create:**
- `src/seed/showcase.ts` — mock KPIs, messages, activity, documents for 20 entities.
- `src/components/MiniDashboard.tsx`
- `src/components/MessageChannel.tsx`
- `src/components/ActivityFeed.tsx`
- `src/components/DocumentsList.tsx`

**Delete:**
- `src/components/GoogleMap.tsx`

---

## 4. Notes

- All design tokens stay on the existing slate/white premium palette.
- No backend, no Supabase, no real messaging — purely seeded TS data.
- The "reports" the user mentioned for later are not built in this round; the showcase profile structure leaves room to plug them in.
