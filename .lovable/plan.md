## What to change

### 1. Every org gets its entity-type dashboard
Currently `DashboardByType` only renders inside the "Showcase" tabs (first 20 orgs). Non-showcase orgs like ABOALAINAIN (`gch-081`, Ginner) only see a lite overview.

- In `src/routes/organizations.$id.index.tsx`, render `DashboardByType` for **every** entity (not gated by `isShowcase`).
- Layout: header → `DashboardByType` → tabs (Overview, KPIs, Ecosystem, Documents, Activity, Missing data).
- Keep `NetworkPassport` + `BenchmarkChart` as showcase-only extras.
- Drop the "Lite profile" amber notice; instead show a small hint inside Documents/KPIs tabs that report uploads enrich the dashboard.

This automatically gives ABOALAINAIN the `GinnerDashboard` (bale throughput, lint quality, moisture, etc.) and every other org the dashboard already built for its `entityType`.

### 2. Research — "no AI balance" + internal-only search
Two fixes in `src/components/ResearchWorkspace.tsx` and `src/lib/research.functions.ts`:

**a. Don't break internal results when AI fails.**
Today, if `runAiResearch` throws (no LOVABLE_API_KEY, no credits, rate-limit), the run is marked `failed` and the user sees an error toast even though internal-network results were already found. Change to:
- Always mark the run `done` once internal search returns.
- If AI succeeds, append AI candidates and toast both counts.
- If AI fails, keep internal results visible, store `aiError` on the run, and show an inline amber notice in the results panel: "AI suggestions unavailable — showing matches from your GCH network only" with the underlying reason (e.g. "AI Gateway: insufficient credits").

**b. Detect the "no balance" case explicitly.**
In `runAiResearch` handler, catch the gateway error, inspect for 402 / "insufficient_quota" / "credits" strings, and rethrow a clean `Error("AI credits exhausted — top up Lovable AI to enable external suggestions")`. Other errors keep their original message.

**c. Internal-only "Search network" action.**
Add a second button next to "New AI research" labeled **Search network** that runs `searchInternal` only (no AI call). Useful when the user just wants to query the 189 orgs.

### 3. Quick polish
- In `NetworkDirectoryCard`, ensure the type filter defaults to the counterpart for the current org (already done) and add a visible result count.
- Toast wording: when AI is disabled, say "Showing network matches only" instead of a red error.

## Files touched
- `src/routes/organizations.$id.index.tsx` — render `DashboardByType` for all orgs, restructure tabs, drop lite notice.
- `src/components/ResearchWorkspace.tsx` — graceful AI-failure handling, inline AI-status banner, "Search network" button.
- `src/lib/research.functions.ts` — classify gateway errors (missing key / no credits) into friendlier messages.
- `src/seed/research-runs.ts` — add optional `aiError?: string` field to `ResearchRun` (non-breaking).

## Out of scope
- No new entity-type dashboards (all 10 types already have one — switch in `DashboardByType` covers Brand, Farmer, Ginner, Spinner, Fabric Mill, Dye House, Garment Factory, Logistics, Cert Body, Sustainability Partner; default falls back to `GenericEntityDashboard`).
- No backend/schema changes; research runs stay in localStorage.