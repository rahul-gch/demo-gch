# Org-aware Research workspace with type-specific search table

Every organization already has a Dashboard tab and a Research tab in the sidebar (`OrgSidebar`). The Research tab currently shows the same generic network directory and result columns for every entity type. We'll make the Research workspace adapt to the viewing org's entity type so the filters, columns, default counterpart, and result presentation all match what that role actually sources.

## Goals

- Consistent layout across all orgs: same Research page shell shows for every entity (already true via `organizations.$id.research.tsx` and `OrgSidebar`); confirm no org is missing it.
- The network search table and AI run result table inside Research are **driven by the viewing org's `entityType`** — different columns, filters, defaults, and quick-prompt chips per role.
- Cross-org AI search remains in plain language (e.g. "manufacturers from Egypt with MOQ < 1000 and lead time < 30 days") but the structured table view above it is tuned per role.

## Scope of changes (frontend only)

Single file: `src/components/ResearchWorkspace.tsx`. No new routes, no backend changes, no schema changes. `research.functions.ts` stays as-is (already accepts free-form query + filters).

### 1. Per-entity-type search profile

Add a `SEARCH_PROFILES: Record<EntityType, SearchProfile>` map. Each profile defines:

- `defaultCounterpart`: which entity type to pre-filter for (reuse existing `COUNTERPART`).
- `quickFilters`: array of one-click chip filters relevant to that role
  (e.g. Brand → "GOTS only", "Lead < 30d", "MOQ < 1000"; Farmer → "Organic", "Within 300 km"; Logistics → "Air freight", "EU export").
- `columns`: ordered list of columns to render in both the network directory and the AI run results table. Each column is `{ key, label, render(entity|candidate) }`. Examples:
  - Brand viewing factories: Name, Country, Product categories, Monthly units, MOQ, Lead, Social audits, On-time, Action.
  - Spinner viewing ginners: Name, Country, Bale capacity, MOQ, Lead, HVI/USTER, Certifications, Action.
  - Farmer viewing ginners: Name, Distance (km), Accepts organic, MOQ, Pricing notes, Action.
  - Dye House viewing fabric mills: Name, Country, GSM range, Monthly meters, Chemistry compliance, Lead, Action.
  - Logistics viewing factories: Name, Country, Monthly volume, Export modes, Incoterms, Lead, Action.
  - Certification Body viewing mills/factories: Name, Scheme(s), Last verified, Expiry, Status, Action.
  - Sustainability Partner viewing brands: Name, Country, Tier-2 visibility %, Frameworks, Engagements, Action.
- `extraFilters`: which numeric/text filter inputs to show
  (e.g. min on-time %, max lead days, min capacity, max distance, certification contains).
- `promptSuggestions`: 3-4 example natural-language queries shown as clickable chips in the New Research dialog (reuse `QUERY_PROMPTS` as the first).

### 2. Refactor `NetworkDirectoryCard`

- Accept `profile: SearchProfile` from parent.
- Replace hardcoded filter inputs and `<TableHead>`/`<TableCell>` blocks with `profile.extraFilters` and `profile.columns.map(...)`.
- Default `etype` to `profile.defaultCounterpart`; keep "All entity types" available.
- Render `profile.quickFilters` as a row of toggle chips above the filters; clicking one mutates filter state.
- Empty-state message references the viewing org's role
  (e.g. "No ginners match these filters for {orgName}. Try a new AI research run.").

### 3. Refactor `RunResults` / `ResultsSection`

- Pass `profile` down and render the AI + network result tables using the same `profile.columns` set so cross-org AI results show in the same shape (with graceful "—" fallbacks for fields the AI didn't return).
- Keep the source split (From your network / Suggested by AI), keep the AI rationale column appended at the end of AI rows.

### 4. New Research dialog

- Replace static placeholder with `profile.promptSuggestions` rendered as clickable chips that fill the textarea.
- Pre-fill `entityType` filter with `profile.defaultCounterpart`, but allow override (so a Brand can also search ginners directly when needed).
- Keep countries/industry inputs as-is.

### 5. Dashboard tab consistency check

- No code changes expected — `DashboardByType` already has per-type dashboards plus `GenericEntityDashboard` fallback, and `organizations.$id.tsx` renders it for every org. We will simply verify by visiting one org of each `EntityType` listed in `ENTITY_TYPES` to confirm a dashboard renders. If any type falls through to placeholder text, we'll wire it to `GenericEntityDashboard` in the same edit.

## Non-goals

- No persistence layer change — research runs stay in `localStorage` via `research-runs.ts`.
- No changes to AI gateway, server functions, or seed entity shape.
- No new sidebar items or routes.

## Acceptance

- Opening Research from any organization shows: role-specific intro line, role-specific quick-prompt chips, a network directory whose columns and filters match the org's role, and AI run results rendered in the same columns.
- Switching between a Brand, a Farmer, a Spinner, a Dye House, and a Logistics Provider visibly changes columns, default counterpart, and quick filters.
- Free-form AI query like "manufacturers from Egypt with MOQ < 1000 and lead time < 30 days" still works on every org and returns rows rendered in that org's column profile.
