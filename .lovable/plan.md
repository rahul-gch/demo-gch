# Plan — Richer per-entity-type dashboards

Today `DashboardByType.tsx` has a dashboard per type, but most are just 4 generic StatTiles + chip lists. Make each one reflect what actually matters for that role in the apparel supply chain. All numeric KPIs derive from existing `Entity` fields (`leadTimeDays`, `onTimeRate`, `avgDelayDays`, `capacity`, `moq`, `verifiedCertCount`, `expiredCertCount`, `evidenceCount`, `profileCompleteness`, `materials`, `capabilities`, `certifications`, `confidenceScore`, `riskLevel`, `traceabilityReadiness`, `kpiReadiness`, `matchmakingReadiness`). No schema changes.

## Shared building blocks (added to `DashboardByType.tsx`)

- `KpiRow` — 4-up StatTile grid (existing pattern).
- `ReadinessCard` — three progress bars: KPI readiness, Traceability readiness, Matchmaking readiness.
- `RiskCard` — confidence score, risk level (color), verified vs expired certs, evidence count, missing-data count.
- `RelationshipsCard` — typical upstream / downstream partners for that tier (derived from a static `TIER_MAP`), so a Spinner shows "Sources from: Ginners · Sells to: Fabric Mills".
- `ReliabilityCard` — keep as-is (lead time, on-time, delay, timeframe).
- `ChipsCard` — keep, used for materials / capabilities / certifications.

Every dashboard composes: **role-specific KPI row → Reliability → Readiness → Risk → Relationships → Chips**. Generic fallback gets the same skeleton minus role KPIs.

## Per-type KPI focus

### Brand (Tier 0)
KPI row: Active suppliers count (length of `materials` as proxy stand-in label "Sourcing tiers covered"), Tier-2+ visibility = `traceabilityReadiness`%, Annual order volume = `capacity` (label "Sourcing volume"), Lead time SLA. Keep `MiniDashboard`. Add Readiness + Risk.

### Farmer (Tier 4)
KPI row: Primary crop, Hectares / annual capacity, Harvest season (derived: "Apr–Oct" if region in N. hemisphere — simple country→hemisphere map), Fiber yield certifications count. Add water-stress hint via country (static high-stress list). Chips: Crops & fibers, Practices, Certifications (BCI / Organic / Fairtrade / Regenagri).

### Ginner (Tier 3)
KPI row: Bale capacity, MOQ, Throughput lead, Contamination-control cert count. Extra: Fiber sources received from (derived from `materials`), USTER/HVI testing badge (true if any cert matches /USTER|HVI|SCS/).

### Spinner (Tier 3)
KPI row: Spindle capacity, Yarn count range (first capability or fallback "Ne 20–60"), MOQ, Lead time. Extra: Blend capability chips, Compact / ring / open-end indicator (from capabilities regex), Energy intensity hint = `kpiReadiness`%.

### Fabric Mill (Tier 2)
KPI row: Monthly meters capacity, MOQ, Lead time, GSM range (first capability matching /\d+\s*g/). Extra: Construction types (knit/woven badges from capabilities), Dye/finishing chip group, Cert count for GOTS / OEKO-TEX.

### Dye House (Tier 2)
KPI row: Daily kg capacity, Water reuse % (derived), Lead time, ZDHC/bluesign cert count. Extra: Process chips (reactive, pigment, digital), Discharge compliance badge.

### Garment Factory (Tier 1)
KPI row: Monthly units, MOQ, Lead time, Social audit count (SA8000/WRAP/BSCI/Sedex). Extra: Product categories (materials), Sewing lines (capabilities), Compliance summary card (expired certs warning).

### Logistics Provider
KPI row: Geographic coverage (region/country), Modes (Sea/Air/Road from capabilities), Avg transit days, On-time %. Extra: Service chips, Accreditations (AEO, C-TPAT, IATA, FIATA detection).

### Certification Body
KPI row: Schemes audited, Region coverage, Avg turnaround, Active audits (= `evidenceCount`). Extra: Scheme chip list with verification badge, Avg confidence score across audited orgs (use `confidenceScore`).

### Sustainability Partner
KPI row: Service areas count (LCA / CFV / Training), Frameworks count (GRI/SBTi/CDP), Avg engagement length, Profile completeness. Extra: Service chips, Frameworks chips, Recent engagements (text from `recommendedNextAction` if present).

### Generic fallback
Already added — keeps Entity type / Location / Capacity / Lead time + Reliability + Readiness + Chips.

## File changes
- `src/components/DashboardByType.tsx` — add `ReadinessCard`, `RiskCard`, `RelationshipsCard`, small helper maps (TIER_MAP, hemisphere map, audit/process regex helpers). Rewrite each per-type dashboard to use the new composition. No new files, no new deps, no route changes.

## Out of scope
- New `Entity` fields, seed edits, charts library, real-time data, edit UI. Everything is read-only presentation derived from existing seed data.
