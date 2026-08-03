## Goal

New organizations should start truly empty: no invented numbers, no "Rahul", and a health/AI score of 0 that only grows as they fill in real data.

## What changes

### 1. Greeting uses the real signed-in user
`AICommandCenter` hardcodes "Rahul" in two places (heading and AI summary). Replace with the signed-in user's name from the auth session (user metadata full name, else the email prefix), falling back to a neutral greeting ("Welcome back") when unknown. Same source that `UserMenu` already uses.

### 2. Health / readiness score starts at 0 for new orgs
`computeNhri` currently adds baseline and pseudo-random values that give a brand-new org a non-zero score:
- `projectActivity` = 40 + random 0-55
- `freshness` = 55 + random 0-40
- `supplyChain` adds a flat +10/+15/+20 tier bonus
- `certifications` adds a flat +10
- `compliance` uses a 0.5 default verified ratio when no certificates exist

For organizations that are not seeded showcase orgs, all pillars will be computed only from data the org actually provided — no random values, no flat bonuses, no default ratios — so an empty profile scores 0 and each completed section visibly lifts the score. Seeded showcase orgs keep their current behaviour.

Consequences handled in the same pass: peer delta and "Rank #x of y" are hidden for new orgs (nothing to compare yet), and the AI summary/health card show a "Start by completing your profile" state instead of score commentary.

### 3. Sweep the dashboard for remaining invented data
Audit every dashboard/tab panel for values that appear without real input for a new org, and replace with explicit empty states ("Not reported yet" / "No data yet") plus the relevant action link. Panels to check: HeroPassport, HealthScoreCard bars, CriticalActionsStrip, PassportCards, OperationsCard, KpiInteractiveGrid, EcosystemSummary, SupplyChainSnapshot, ReadinessBreakdown, ActivityTimeline, OpportunitiesPanel, MissingDataGamified, and the Insights / Network / Performance / Compliance / Supply Chain / AI tabs.

## Notes

- Frontend/derivation-layer only; no database or schema changes.
- Existing seeded demo organizations are untouched so the showcase still demos well.
