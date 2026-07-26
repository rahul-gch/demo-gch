## Goals

1. Fix "Create new organization" so it actually works end-to-end.
2. Extend signup to capture operational fields (MOQ, lead time, materials, cloth categories, etc.) — with the form adapting to the selected org type.
3. Give Sharabati a 5-star rating.
4. Rework Matchmaking: add AI-powered partner search, remove visible scoring UI, add an "i" tooltip explaining how scores are calculated, and add category filters (materials for manufacturers, gender categories for brands).
5. Upgrade Compliance: add a score for each social audit, make audit/certificate rows clickable to open a details drawer, and seed dummy details.
6. Fill in dummy data wherever an example is missing so each feature is self-explanatory.

## 1. Fix org creation

- Investigate the failure first — the user says it isn't working, but I don't yet have the exact error. Reproduce via the /signup form with the browser tool, capture the console + network error, and confirm root cause (likely one of: missing `SELECT` after INSERT because of `owner`-check policy on `orgs`, `certifications` NOT NULL default, or slug collision loop).
- Apply the concrete fix (server function + form) once the cause is confirmed. Surface the real error message in the toast instead of a generic "Failed to create organization".

## 2. Extended signup form (adaptive)

Add a **third optional step** to `CreateOrgForm` that swaps fields based on the selected `type`:

- Always: `size`, `region`, `tier`, `certifications`, `description`, `moq`, `leadTimeDays`, `capacity`, `onTimeRate`.
- Manufacturers/mills/farmers/ginners/spinners: `materials` (multi-select: cotton, denim, wool, viscose, polyester, linen, silk, recycled cotton, hemp), `capabilities` (weaving, knitting, dyeing, finishing, cut & sew, embroidery, printing).
- Brands: `productCategories` (Women, Men, Kids, Unisex, Baby, Accessories), `productTypes` (T-shirts, Denim, Outerwear, Loungewear, Activewear).
- Logistics/certification/sustainability: keep base fields only.

DB: add nullable columns to `public.orgs` — `moq text`, `lead_time_days int`, `capacity text`, `on_time_rate int`, `materials text[]`, `capabilities text[]`, `product_categories text[]`, `product_types text[]`. Extend the `createOrg` zod schema + insert accordingly.

## 3. Sharabati — 5-star rating

Add a `rating` field (1-5) to the `Entity` seed type. Set Sharabati (`gch-135`) to 5, seed reasonable ratings (3-5) on other orgs so it isn't the only one, and render a star row on org cards + hero.

## 4. Matchmaking redesign

- **Remove visible scoring**: drop the numeric % + progress bars from `MatchmakingPanel` and `/organizations/$id/matchmaking` table. Keep scoring internally for sort order only.
- **"i" tooltip**: next to the section title, add a small info icon that opens a popover explaining the 7 factors (material overlap, certification overlap, tier complementarity, region, KPI overlap, capacity fit, delivery reliability) with weights — content sourced from `src/seed/matchmaking.ts`.
- **Category filters**:
  - Viewer is a manufacturer/mill → show material chips ("Cotton", "Denim", …); selecting narrows partner list to those that share material.
  - Viewer is a brand → show gender/product chips (Women/Men/Kids/…).
  - Always available: country, tier, certification filters.
- **AI search bar**: free-text input above the results ("find me a GOTS-certified denim mill in Turkey with lead time under 30 days"). Route to a new `createServerFn` (`aiSearchPartners`) that calls Lovable AI Gateway to return structured filters `{ materials?, country?, tier?, certifications?, maxLeadTimeDays?, productCategories? }`, then apply those to the local candidate list. Show the parsed criteria as removable chips beneath the input.
- Same category chips + AI search added to the global `/matchmaking` route.

## 5. Compliance upgrades

- **Audit score**: extend the mock audit shape in `src/seed/compliance.ts` with `score` (0-100) and `findings[]` (title, severity, area). Show the score as a colored pill in the row.
- **Clickable rows**: make each audit and each product certification / TC row open a right-side `Sheet` with:
  - Header (standard, auditor, date, next due, score).
  - Findings table (severity, area, description, corrective action, due date).
  - Attached documents list (dummy PDF entries + "Download" button that no-ops with toast).
- Seed 3-6 findings per audit (mix of Passed / Minor / Major) so the drawer looks realistic. Same for TC and certification details.

## 6. Dummy data pass

Wherever a section currently renders "No data" and the user hasn't uploaded anything (e.g. certifications missing, audits empty, matchmaking with a sparse org), seed 2-3 sample rows tagged "Sample" so newcomers see how the feature works. Applies to Compliance, Matchmaking, Supply Chain recommendations, and org KPI snapshot.

## Files touched (technical)

- `supabase migration`: add columns to `public.orgs`.
- `src/lib/orgs.functions.ts`: extend `createOrgSchema` + insert; return real error string.
- `src/components/signup/CreateOrgForm.tsx`: adaptive third step, materials/product multi-select chips.
- `src/seed/types.ts`, `src/seed/all-entities.ts` (or overrides file): add `rating`; set Sharabati = 5.
- `src/seed/matchmaking.ts`: keep scoring; export a `WEIGHTS` constant for the tooltip.
- `src/routes/_authenticated.organizations.$id.matchmaking.tsx`, `src/components/MatchmakingPanel.tsx`, `src/routes/_authenticated.matchmaking.tsx`: hide %, add category chips + AI search + info popover.
- `src/lib/matchmaking-ai.functions.ts` (new): server fn using `createLovableAiGatewayProvider` + `generateText` with `Output.object`.
- `src/seed/compliance.ts`: add `score`, `findings`, seed content.
- `src/components/compliance/CompliancePage.tsx`: clickable rows, new `AuditDetailSheet` + `CertDetailSheet` components (colocated).

## Open questions

- The "add org not working" error text — if you can paste the exact toast/console message, the fix will be one-shot instead of investigate-then-fix.
- For AI partner search, OK to use Lovable AI (default, no key needed)?
