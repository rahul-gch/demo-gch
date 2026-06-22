# Per-Entity Dashboards + Per-Org AI Research

Two things land together: (1) fill the missing per-entity-type dashboards so every org has a tailored view, and (2) add a Research workspace (AI search) on every org's sidebar, modeled after the screenshots.

## 1. Per-Entity Dashboards

`DashboardByType` already routes Brand / Farmer / Ginner / Spinner / Fabric Mill / Dye House / Garment Factory / Logistics / Cert Body / Sustainability Partner, but four types collapse onto generic shells. Replace with dedicated dashboards so each entity type shows what matters:

- **Brand** (keep, already custom) — KPI snapshot + reliability.
- **Farmer** — crop, hectares, harvest season, fiber yield, certifications (BCI/Organic/Fairtrade), region/water risk.
- **Ginner** — bale capacity, fiber sources, contamination control, throughput, lead time.
- **Spinner** — yarn counts, spindle capacity, blend capability, MOQ, on-time rate.
- **Fabric Mill** — fabric types (knit/woven), GSM range, monthly meters, dye/finishing, MOQ.
- **Dye House** — process types (reactive/pigment), ZDHC/bluesign, water reuse %, capacity kg/day.
- **Garment Factory** — product categories, sewing lines, monthly units, social audits (SA8000/WRAP/BSCI), MOQ.
- **Logistics Provider** — modes (sea/air/road), lanes covered, transit time, on-time %, customs services.
- **Certification Body** — schemes audited, accreditations, turnaround, region coverage, active audits.
- **Sustainability Partner** — service areas (LCA/CFV/training), tools, engagements, frameworks (GRI/SBTi).

Shared `ReliabilityCard` (lead time, delivery timeframe, on-time, avg delay) stays as a footer on every dashboard. Each dashboard reuses `StatTile` + `Badge` lists already in `DashboardByType.tsx` — just adds type-specific tile groupings. Pure presentational; no schema change.

## 2. Per-Org AI Research Workspace

New route: `src/routes/organizations.$id.research.tsx`, plus sidebar entry "Research" (with Sparkles icon) in `OrgSidebar`.

### UI (matches screenshots)
- Header: "Research Workspace" + tagline scoped to the org ("Discover partners across the GCH network for {orgName}").
- Left column: **Runs (n)** list — each run shows query, timestamp, status (running / done / failed), result count.
- Right column: empty state with "Start your first research" CTA; once a run is selected, shows results table (Org name, type, country, MOQ, lead time, match score, "Add to matches" action).
- "+ New research" button opens a Dialog with: Search Query (textarea, required), Countries (comma list), # Results (number, default 20), Industry, Entity Type. "Start research" submits.

### Search behavior (two-tier, no schema changes)
1. **Internal search (always runs first, instant)** — filter `getAllEntities()` against the parsed criteria (country, entityType, materials match, moq/lead time thresholds extracted from query). Returns matches from the GCH network.
2. **AI expansion (optional)** — when the user toggles "Expand with AI" (or always, behind a flag), call Lovable AI Gateway (`google/gemini-3-flash-preview`) via a `createServerFn` (`src/lib/research.functions.ts`) that:
   - Takes `{ query, countries, entityType, industry, limit }`.
   - Returns structured candidates `{ name, country, city, entityType, materials, moq, leadTimeDays, rationale, sourceUrl? }[]` via `Output.object` + Zod schema.
   - Marks each candidate `source: "ai"` vs internal `source: "network"`.

Internal results render first; AI candidates render in a separate "Suggested from web" section with an "Invite / add to network" stub button (toast for now).

### Run persistence
Runs persist per-org in `localStorage` via a new `src/seed/research-runs.ts` helper (same pattern as `org-overrides.ts`): `{ id, orgId, query, params, createdAt, status, results }[]`. Survives reload without backend.

### Files
**Create**
- `src/lib/research.functions.ts` — `runAiResearch` server function (Lovable AI Gateway, structured output).
- `src/lib/ai-gateway.server.ts` — provider helper (if not already present).
- `src/seed/research-runs.ts` — localStorage CRUD for runs.
- `src/components/ResearchWorkspace.tsx` — runs list + results panel + new-run dialog.
- `src/routes/organizations.$id.research.tsx` — wraps `ResearchWorkspace` with the active org.

**Edit**
- `src/components/DashboardByType.tsx` — add the 6 missing dedicated dashboards.
- `src/components/OrgSidebar.tsx` — add "Research" nav item under the org workspace.

## Out of scope (ask if wanted)
- Persisting research runs to the database (currently localStorage).
- Web scraping via Firecrawl (screenshots mention it; current plan uses AI-only expansion — add Firecrawl later if you want real web discovery).
- "Approve into Organizations" flow that converts an AI candidate into a real `Entity` in seed data.
