
# Global Chain Hub — Registry Prototype Plan

Rebuild the app as a calm, premium B2B SaaS admin tool focused only on the entity registry foundation. No auth, no Supabase, no comms, no traceability.

## 1. Cleanup (remove everything out of scope)

Delete:
- `src/routes/login.tsx`, `src/routes/how-it-works.tsx`, `src/routes/org.$slug.tsx`
- `src/components/UserDashboard.tsx`, `MessagesPanel.tsx`, `RoleGate.tsx`, `EcosystemGraph.tsx`, `EcosystemMap.tsx` (replaced by new components)
- `src/lib/auth.ts`, `org.functions.ts`, `user-scope.ts`, `messaging.ts`, `matchmaking.ts`, `ecosystem-data.ts`
- Server-fn / Supabase auth wiring usage in routes (files in `src/integrations/supabase/` stay untouched but unused)

Keep: shadcn UI, `__root.tsx`, router, styles, types.

## 2. Seed data from your Excel

Parse `Entity Database GCH.xlsx` (957 rows) → pick 20 representative entities across the required mix:
2 Brands, 2 Farmers, 2 Ginners, 2 Spinners, 2 Fabric Mills, 2 Dye Houses, 3 Garment Factories, 2 Logistics, 1 Certification Body, 2 Sustainability Partners — biased toward IN, BD, TR, PT, DE, SE, NL, VN, PK, IT.

Generate `src/seed/entities.ts` with the full schema you specified (id, name, entityType, organizationType, actorType, country/region/city, lat/lng, description, materials, capabilities, capacity, moq, leadTimeDays, certifications, confidenceScore, riskLevel, evidenceCount, missingDataCount, profileCompleteness, verificationStatus, preferredCommunicationChannel, kpiReadiness, traceabilityReadiness, matchmakingReadiness, missingFields, recommendedNextAction).

Real fields (name, GCH-Number, country, city, address, tier, entity type) come from the Excel; readiness/score/risk fields are deterministically derived from completeness so the prototype feels real.

Also export `TOTAL_ENTITIES = 200`, `entityTypeBreakdown()`, `summaryMetrics()` helpers.

## 3. App shell

New `src/components/AppShell.tsx` with a shadcn `Sidebar` (collapsible="icon") + top header. Sidebar links:
- Platform Dashboard `/`
- Organizations `/organizations`
- Map View `/map`
- Settings `/settings`

Mounted in `__root.tsx`. White bg, slate text, soft borders, subtle shadows — no bright colors.

## 4. Routes

- `src/routes/index.tsx` — Platform Dashboard: 6 KPI cards + 4 sections (Registry Preview top-5 table, Entity Type Breakdown list, Data Readiness summary, Map Preview card with "Open Map View" CTA → `/map`). Calm, generous spacing.
- `src/routes/organizations.tsx` — Registry table with search + 8 filter dropdowns (Entity Type, Actor Type, Country, Certification, Risk, Confidence, Verification, Completeness). All 14 columns scrollable. Row click → profile.
- `src/routes/organizations.$id.tsx` — Profile: header, 4-card mini dashboard, profile details, readiness section (3 progress bars), location card (mock map with single pin), missing-data list, recommended next action.
- `src/routes/map.tsx` — Full map view with filters + side panel on pin click. Mock map (equirectangular world SVG background with absolute-positioned pins from lat/lng) — no API key required. Pin color encodes verification/risk via slate/neutral tones with subtle indicators. Side panel shows summary + "View Full Profile" button.
- `src/routes/settings.tsx` — Static UI: Confidence Settings (sliders/inputs), Profile Requirements (checkbox list), Matching Parameters (chips), Matching Weights table with the 8 weights you listed. No persistence.

## 5. Map approach

Pure CSS/SVG mock map using a world outline SVG + absolute pins positioned by lat/lng→x/y projection. Clean, neutral, no Google key. Pins are small slate circles with a ring indicating verification state.

## 6. Design tokens

Adjust `src/styles.css` to a premium neutral palette: white bg, slate-900 text, slate-200 borders, single muted accent (slate-700). Soft shadows, rounded-xl cards. Remove any prior vivid tokens.

## 7. Out of scope (explicitly not built)

Login, accounts, personas, communications, product journey, traceability, uploads, backend, Supabase calls, AI, blockchain, payments.

## File tree (after)

```text
src/
  components/
    AppShell.tsx
    AppSidebar.tsx
    MockWorldMap.tsx
    StatCard.tsx
    ReadinessBar.tsx
    ui/*  (unchanged)
  seed/
    entities.ts
    types.ts
  routes/
    __root.tsx
    index.tsx
    organizations.tsx
    organizations.$id.tsx
    map.tsx
    settings.tsx
  styles.css
```

Ready to switch to build mode and execute.
