## Goal

Mirror the Nike treatment for 5 more brands using their uploaded sustainability reports. Existing orgs get their dashboards upgraded with real KPI overrides; missing ones get created from scratch.

## Brand status

| Brand | Status | Action |
| --- | --- | --- |
| H&M Group | Not in registry | Create `gch-hm` |
| Marks & Spencer | Not in registry | Create `gch-mands` |
| Primark | Not in registry | Create `gch-primark` |
| PUMA | Exists (`gch-170`) | KPI overrides + showcase |
| Zalando | Exists (`gch-123`) | KPI overrides + showcase |

Nike pattern already in place (`src/seed/nike.ts` + `ENTITY_KPI_OVERRIDES` in `src/seed/kpi/index.ts`).

## 1. Parse the 6 uploaded PDFs

Use `document--parse_document` on each report to extract verified FY/CY metrics: Scope 1&2 reduction, Scope 3, renewable electricity %, recycled / preferred materials %, water reduction, waste diverted, supply-chain traceability %, living-wage / social KPIs. Source URL + page noted on each override.

## 2. New org files

Create one file per new brand, modeled on `src/seed/nike.ts`:

- `src/seed/hm.ts` → `HM` entity (Tier 0 Brand, Stockholm, SE) + `HM_KPI_OVERRIDES`
- `src/seed/mands.ts` → `MANDS` (Tier 0 Brand, London, UK) + overrides
- `src/seed/primark.ts` → `PRIMARK` (Tier 0 Brand, Dublin, IE) + overrides

Each entity uses real HQ coords, materials, certifications (e.g. Better Cotton, OCS, GRS, RCS, ZDHC, SAC/Higg, SBTi, LWG where applicable), governance/traceability notes pulled from the report, public IR/sustainability contacts, `verificationStatus: Verified`, `riskLevel: Low`, `profileCompleteness: ~95`.

## 3. KPI override files for existing brands

Instead of mutating auto-generated `entities.ts`, add override-only modules that key off existing ids:

- `src/seed/puma.ts` → `PUMA_KPI_OVERRIDES` (no entity, just KPIs sourced from PUMA Annual Report 2025)
- `src/seed/zalando.ts` → `ZALANDO_KPI_OVERRIDES` (from Zalando 2023 Progress + 2024 CSRD Digest)

## 4. Wire-up

Edit `src/seed/all-entities.ts`:

```ts
import { NIKE } from "./nike";
import { HM } from "./hm";
import { MANDS } from "./mands";
import { PRIMARK } from "./primark";
export const ALL_ENTITIES = [NIKE, HM, MANDS, PRIMARK, ...BASE_ENTITIES];
```

Edit `src/seed/kpi/index.ts`:

```ts
import { NIKE_KPI_OVERRIDES } from "../nike";
import { HM_KPI_OVERRIDES } from "../hm";
import { MANDS_KPI_OVERRIDES } from "../mands";
import { PRIMARK_KPI_OVERRIDES } from "../primark";
import { PUMA_KPI_OVERRIDES } from "../puma";
import { ZALANDO_KPI_OVERRIDES } from "../zalando";

const ENTITY_KPI_OVERRIDES = {
  "gch-nike": NIKE_KPI_OVERRIDES,
  "gch-hm": HM_KPI_OVERRIDES,
  "gch-mands": MANDS_KPI_OVERRIDES,
  "gch-primark": PRIMARK_KPI_OVERRIDES,
  "gch-170": PUMA_KPI_OVERRIDES,    // PUMA
  "gch-123": ZALANDO_KPI_OVERRIDES, // Zalando
};
```

Edit `src/seed/showcase.ts` `SHOWCASE_IDS` to include the 3 new ids + `gch-170` + `gch-123` so their Network Passport / tabs render.

## 5. Featured carousel

Update the "Featured Network Passport" section in `src/routes/index.tsx` to rotate across all 6 brands (Nike, H&M, M&S, Primark, PUMA, Zalando) instead of Nike-only.

## 6. Verification

- Browser-check `/organizations/gch-hm`, `/organizations/gch-mands`, `/organizations/gch-primark`, `/organizations/gch-170`, `/organizations/gch-123` — passport + tabs render, KPI snapshot shows real numbers with "Verified high" confidence + report source.
- Console clean, no TS errors.

## Files

Create: `src/seed/hm.ts`, `src/seed/mands.ts`, `src/seed/primark.ts`, `src/seed/puma.ts`, `src/seed/zalando.ts`
Edit: `src/seed/all-entities.ts`, `src/seed/kpi/index.ts`, `src/seed/showcase.ts`, `src/routes/index.tsx`
