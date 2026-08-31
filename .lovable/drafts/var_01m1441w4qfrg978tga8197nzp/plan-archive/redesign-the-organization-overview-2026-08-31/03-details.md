## Section by section

**Hero** — dark banner with logo medallion, name, verified badge, GCH number, type, location, and capability tags. Score/profile/member stats and the "AI says" side panel are removed from the hero (they now live in the KPI row and AI Brief).

**Four KPI cards** — light cards, big number, small caption, one quiet icon:
Health Score (/100 + band word), Profile (% + Complete/In progress), Trust & Compliance (% verified certifications), Network (partner count + countries). Any card with no data shows 0 with a neutral caption instead of a fake number.

**AI Brief** — three short bullets with colored dots, derived from the existing brief helpers (expiring certificate, partner matches, supply-chain/risk signal), plus one "recommended next step" link. New organizations get onboarding-oriented bullets.

**Recommended Actions** — the existing action queue restyled as compact rows: icon, title, one-line why, an outcome hint on the right, and a small button. Capped at four rows with a "View all actions" link.

**Passport progress** — completeness percent, a single slim bar, remaining-items count, the next item as a small chip, and a "Complete now" link.

**Operations Overview** — four metric boxes (lead time, MOQ, capacity, on-time rate) plus chip rows for specializations, materials and capabilities, with a "View operations" link. Rows with no values are hidden.

**Recent Activity** — four latest events grouped by day with timestamps and a "View all activity" link to the Activity tab.

Tabs stay as they are: Overview, Performance, Network, Documents, Activity.

## Technical notes

- Route composition rewritten in `src/routes/_authenticated.organizations.$id.index.tsx`; overview no longer renders `ScoreCard`, `StatTile`/`OverviewStats`, `MissingDataGamified`, `PassportCards`, `ShowroomStrip`.
- New presentational components under `src/components/dashboard/`: `KpiRow.tsx`, `AiBriefCard.tsx`, `PassportProgressCard.tsx`, plus a compact `OperationsOverview.tsx` summary (the full `OperationsCard` stays available for the detail page).
- `HeroPassport.tsx` trimmed to identity only; `ActionQueue.tsx` restyled to the row format and capped; `ActivityTimeline.tsx` keeps its `limit` prop.
- All values come from the loaded `Entity`, `computeNhri`, and the existing `dashboard-derive` helpers — no new data fetching, no scoring changes, no hardcoded organization content.
- Colors go through existing semantic tokens; layout uses the responsive grid rules (1 column on mobile, 2 on tablet, 4/3/2 on desktop).
