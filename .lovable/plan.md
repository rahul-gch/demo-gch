## Goal

Turn the first 20 seeded orgs (`gch-001`…`gch-020`) into complete real profiles wired to the uploaded **GCH Benchmark & KPI Intelligence Dataset v0.1** — real KPI library + confidence model, deterministic KPI values per entity, ecosystem view, matchmaking across all 189 entities, communication, documents, report upload.

The 20 showcase entities stay as they are (not aliased to Inditex/H&M/etc.). The Excel `Company_Benchmark` rows are used **only as a separate "Sector benchmark" reference panel** for context; other companies will be filled in later.

---

## 1. Ingest the KPI dataset

New folder `src/seed/kpi/`:

- `kpi-library.ts` — all 18 KPIs from `KPI_Library` (id, name, category, definition, unit, MVP priority, confidence rule).
- `confidence-rules.ts` — 5 bands (Verified / Documented / Declared / Estimated / Insufficient) + color tokens.
- `normalization-map.ts` — company term → GCH KPI mapping.
- `company-benchmark.ts` — the 21 real benchmark rows kept as reference data (used in the "Sector benchmark" panel, NOT applied to the 20 showcase orgs).
- `index.ts` — helpers:
  - `getKpisForEntity(e)` → deterministic per-entity KPI rows (value, normalized value, unit, confidence score+label, source = "Reported by org") seeded from entity id so the same org always shows the same numbers, biased by tier / certifications / materials so the values feel coherent.
  - `getSectorBenchmark(kpiId)` → min / median / max derived from `company-benchmark.ts` for the peer reference panel.
  - `getConfidenceBand(score)`.

## 2. Showcase profile (`/organizations/$id` for ids 001–020)

Add to `ShowcaseTabs`:

- **Overview** — new "KPI snapshot" card: 4 headline KPIs (Scope 1&2, Scope 3, Recycled material share, Tier 1 visibility) with value, unit, confidence chip.
- **Dashboard** — keep MiniDashboard, append **Benchmark vs Sector** row: entity value vs sector min/median/max from `getSectorBenchmark`.
- **KPIs** (new tab) — full table of all 18 KPIs for this entity with confidence band coloring, MVP priority badge, and a link to the underlying confidence rule.
- **Ecosystem** — existing Google Map + upstream/downstream/verifier list, plus a tiny stat: "X matchmaking candidates across 189 entities".
- **Matchmaking** — upgrade to score against **all 189 entities** (see §4), top 8 with reason chips and score bar.
- **Messages** — unchanged.
- **Documents** — existing list + a **real report uploader** (Supabase Storage `org-docs`, row in `org_documents` with `category='report'`). Uploaded reports also appear as activity entries.
- **Activity** — existing + "Report uploaded" entries.
- **Missing data** — existing checklist + KPI-level rows (e.g. "Scope 3 not reported", "Tier 2 visibility missing").

## 3. Dashboard (`/`) updates

- Keep the EcosystemGoogleMap.
- New "Benchmark intelligence" strip: 4 KPI tiles showing sector min / median / max from the Excel benchmark (clearly labeled "Sector reference — Inditex, H&M, Nike, Adidas, Puma, Patagonia, Primark, M&S, Zalando…").
- "Top 20 showcase orgs" list with profile completeness + KPI confidence average.

## 4. Matchmaking across all 189 entities

`src/seed/matchmaking.ts`:

```text
score(a, b) =
  20 * materialOverlap
+ 15 * certOverlap
+ 20 * tierComplementarity   // brand↔garment↔mill↔spinner↔ginner↔farmer
+ 15 * regionProximity       // same country=1, same region=0.6, else 0.2
+ 15 * kpiCompatibility      // shared KPI categories where both have confidence ≥ 50
+ 15 * capacityFit           // MOQ vs capacity heuristic
```

- Used by each showcase profile's Matchmaking tab.
- New top-level route **`/matchmaking`** — sortable table of suggested pairs across the whole 189-entity registry, filters: tier, country, material, min score.

## 5. Report upload (real)

- `org-docs` bucket exists already.
- New `src/lib/uploadOrgReport.ts` uses `supabase.storage.from('org-docs').upload(...)` and inserts into `org_documents` with the current user id.
- Documents tab merges seeded mock docs (showcase only) with real rows queried from `org_documents`.
- If user not signed in: show a "Sign in to upload" button. (Auth screen is out of scope unless you ask for it.)

---

## Files

**Create**
- `src/seed/kpi/kpi-library.ts`
- `src/seed/kpi/confidence-rules.ts`
- `src/seed/kpi/normalization-map.ts`
- `src/seed/kpi/company-benchmark.ts`
- `src/seed/kpi/index.ts`
- `src/seed/matchmaking.ts`
- `src/components/KpiSnapshot.tsx`
- `src/components/KpiTable.tsx`
- `src/components/BenchmarkChart.tsx`
- `src/components/ReportUploader.tsx`
- `src/routes/matchmaking.tsx`

**Update**
- `src/routes/organizations.$id.tsx` (KPIs tab, snapshot, benchmark row, uploader)
- `src/routes/index.tsx` (benchmark strip, showcase orgs list)
- `src/components/MiniDashboard.tsx` (sector benchmark row)
- `src/components/MatchmakingPanel.tsx` (uses new scoring, top 8)
- `src/seed/showcase.ts` (`getMatchSuggestions` delegates to `src/seed/matchmaking.ts`)

No DB migrations — `org_documents` and `org-docs` bucket are already in place.