# Mission Control Redesign

Turn the org workspace and platform home from "collection of cards" into an operating system anchored by a **Network Health & Readiness Index (NHRI)** — a 0–100 live score that becomes the platform's signature metric. Frontend + seed only; no backend changes.

## 1. New signature: Network Health & Readiness Index

New module `src/lib/nhri.ts` computes a deterministic 0–100 score per entity from existing seed fields.

Weights (documented in code):
- Profile completeness — 20
- Compliance (verified vs expired certs) — 18
- Supply chain transparency (traceability + tier depth) — 15
- Ecosystem connectivity (partners/projects count) — 12
- Certifications breadth — 10
- Project activity — 10
- AI confidence score — 10
- Data freshness — 5

Returns `{ score, band, breakdown[{key,label,value,weight,contribution}], topDrags[], topLifts[], deltaVsPeers }`. Band thresholds: 85+ Excellent, 70+ Strong, 55+ Developing, <55 At Risk.

## 2. Org workspace: new information architecture

Replace current stacked cards on `/organizations/$id` with a Mission Control layout, and restructure tabs.

**New tabs** (rename in `OrgSidebar.tsx` + add route redirects, keep old routes as content sources):
`Overview · Insights · Network · Performance · Compliance · Supply Chain · AI · Documents · Activity`

Mapping to existing routes (no route deletion — just relabel + new Overview):
- Overview → new redesigned `organizations.$id.index.tsx`
- Insights → new subview (AI Command Center + Opportunities)
- Network → existing ecosystem/matchmaking content
- Performance → existing KPI content
- Compliance → existing compliance route
- Supply Chain → existing supply-chain route
- AI → new subview surfacing AI recommendations + readiness
- Documents / Activity → existing

## 3. Redesigned Overview (org)

Rebuild `src/routes/organizations.$id.index.tsx` composed of new components under `src/components/dashboard/`:

1. **HeroPassport** — big org identity block. Left: name, verified pill, country, tier, org type. Right stat row: NHRI score, Profile %, Global Rank (derived from NHRI ordering across ALL_ENTITIES), Members, Active Projects, Partners.
2. **AICommandCenter** — greeting ("Good morning, {user}"), one-paragraph AI summary generated deterministically from seed (missing docs count, matches, project alerts, updated certs), and 3 CTA buttons (Complete Missing Data / Review Supplier Risk / Invite Partner).
3. **HealthScoreCard** — huge NHRI number + band, horizontal segmented bar showing 6 pillars (Profile, Compliance, Supply Chain, Circularity, Visibility, Trust) each with mini value.
4. **CriticalActionsStrip** — 3 cards: expiring cert, new partner matches, supply chain risk delta.
5. **KpiInteractiveGrid** — replaces `KpiSnapshot`. Each tile shows: current, trend arrow + delta, target, confidence %, status pill.
6. **EcosystemSummary** — Network counts (orgs, countries, research, suppliers, NGOs, auditors, certifiers) + compact map preview linking to full map.
7. **MissingDataGamified** — progress bar + list of missing fields with estimated time and upload/edit CTA.
8. **SupplyChainSnapshot** — suppliers, countries, risks, delays, certified counts + tier bar viz.
9. **ReadinessBreakdown** — top-level Readiness score + sub-bars: Matchmaking, Supply Chain, Compliance, Digital Passport, Blockchain Ready.
10. **ActivityTimeline** — replaces `ActivityFeed`, grouped by Today / Yesterday / This week.
11. **OpportunitiesPanel** — AI Opportunities: qualifying grant, top potential partner (from matchmaking seed), suggested research institute.
12. **QuickActionsDock** — sticky bottom-right floating cluster: Create Project, Find Partner, Upload Certificate, Map Supply Chain, Invite Member, Generate Report.

All numbers derive from existing seed (`all-entities`, `matchmaking`, `projects`, `kpi`, `showcase`) plus new helpers in `src/lib/nhri.ts` and `src/lib/dashboard-derive.ts`.

## 4. Redesigned Network Passport

Rewrite `NetworkPassport.tsx` as 4 passport-style cards (Identity · Supply Chain · Compliance · AI Health), each with a header stripe, key metric, and 2–3 sub-stats. Used on the platform home Featured section and on org Overview.

## 5. Platform home (/) as Mission Control

Rebuild `src/routes/index.tsx` sections in this order:
1. Greeting + platform-wide NHRI aggregate (avg + top movers)
2. AI Summary (registry-wide: new orgs, expiring certs, matches created)
3. Health distribution bar (Excellent/Strong/Developing/At Risk counts)
4. Featured Network Passports (redesigned cards)
5. Supply Chain heatmap summary
6. Compliance snapshot
7. Performance (benchmark intelligence, kept + restyled)
8. Network (map preview + counts)
9. Projects highlights
10. Latest Activity timeline

Sections separated by full-width horizontal rules to evoke the "mission control" divider feel.

## 6. Files

**New**
- `src/lib/nhri.ts` — scoring
- `src/lib/dashboard-derive.ts` — derived counts (rank, opportunities, greeting, AI summary text)
- `src/components/dashboard/HeroPassport.tsx`
- `src/components/dashboard/AICommandCenter.tsx`
- `src/components/dashboard/HealthScoreCard.tsx`
- `src/components/dashboard/CriticalActionsStrip.tsx`
- `src/components/dashboard/KpiInteractiveGrid.tsx`
- `src/components/dashboard/EcosystemSummary.tsx`
- `src/components/dashboard/MissingDataGamified.tsx`
- `src/components/dashboard/SupplyChainSnapshot.tsx`
- `src/components/dashboard/ReadinessBreakdown.tsx`
- `src/components/dashboard/ActivityTimeline.tsx`
- `src/components/dashboard/OpportunitiesPanel.tsx`
- `src/components/dashboard/QuickActionsDock.tsx`
- `src/components/dashboard/PassportCards.tsx`

**Edited**
- `src/routes/organizations.$id.index.tsx` — compose new Overview
- `src/routes/index.tsx` — Mission Control home
- `src/components/OrgSidebar.tsx` — renamed tab labels + new Insights/AI entries
- `src/components/NetworkPassport.tsx` — passport card redesign
- `src/seed/showcase.ts` — extend mock activity/kpi where needed (additive only)

**Untouched**
- Messages, Meetings, Projects internals, Matchmaking logic, all backend, all seed sources of truth (all-entities, kpi library, matchmaking).

## Technical Notes

- Design tokens only (semantic Tailwind classes); no hardcoded colors. Health bands mapped to existing `confidenceClasses` tones + one new `--nhri-*` token set in `src/styles.css`.
- All new components are pure presentation, take `Entity` (or nothing) as props, read via lib helpers.
- Global Rank = index of entity when `ALL_ENTITIES` sorted by NHRI desc.
- AI Summary text is templated from seed counters — no Lovable AI call this pass (per your choice), but `AICommandCenter` accepts an optional `summary` prop so a server function can plug in later without refactor.
- Quick Actions Dock uses existing routes (`/matchmaking`, org `/projects`, `/messages`, etc.).
- Keep bundle lean: no new deps.
