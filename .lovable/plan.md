# Plan — Matchmaking depth + cross-profile messaging

Four connected pieces: (1) entity-type-aware dashboards, (2) a rich matchmaking profile view, (3) new matchmaking settings (delivery timeframe / delays), (4) messaging + meeting requests across matched profiles.

## 1. Entity-type aware dashboards

Today every org renders the same layout (`src/routes/organizations.$id.tsx`). Different actor types care about different things. Introduce a dashboard variant chosen from `entity.entityType` / `actorType`:

- **Brand (Tier 0)** — current "Network Passport" view (KPIs, scope emissions, supplier visibility, featured matches).
- **Farmer / Ginner (Tier 4-3)** — crop/material output, harvest season, certifications (BCI / Organic), region & water KPIs, downstream buyer matches.
- **Spinner / Fabric Mill / Dye House (Tier 2)** — capacity, MOQ, fiber blends handled, ZDHC / chemical KPIs, lead time, energy mix.
- **Garment Factory (Tier 1)** — capacity, product categories, social KPIs (wages, audits), lead time, current buyer brands.
- **Logistics / Certification / Sustainability Partner** — services, coverage regions, accreditations, active engagements.

Implementation: a `DashboardByType` switch component + small per-type panel components (`BrandDashboard`, `UpstreamSupplierDashboard`, `MillDashboard`, `FactoryDashboard`, `ServiceProviderDashboard`). Shared header/profile block stays.

## 2. Matchmaking profile detail

Right now `MatchmakingPanel` and `/matchmaking` only show a name, score, and "Open match" link. Add an inline detail view so users don't have to leave the page:

- Click any matched org → opens a side **Sheet** (`MatchProfileSheet`) with:
  - Identity: name, tier, country, region, HQ
  - Operations: lead time (days), MOQ, capacity, delivery timeframe, recent on-time %, delay history
  - Materials & fabrics available, capabilities
  - Certifications (with verified/expired status)
  - Top KPI snapshot (3–4 most relevant for that entity type)
  - Match reasons + score breakdown bars
  - Actions: **Message**, **Request meeting**, **Open full profile**
- Same sheet is reused from: `MatchmakingPanel` (org page), `/matchmaking` table rows, and the suggested-match cards on dashboards.

## 3. Matchmaking settings additions

Extend `src/routes/settings.tsx`:

- New **Delivery & reliability** card with editable fields:
  - Target delivery timeframe (days)
  - Max acceptable delay (days)
  - Penalty weight for delays (% deduction from match score)
  - Minimum on-time delivery rate
- Add `Delivery timeframe`, `On-time rate`, `Delay history` to the `MATCHING_PARAMETERS` chip list.
- Add a `Delivery & reliability` row to the `WEIGHTS` table (rebalance so total stays 100%).
- Extend `scoreMatch` in `src/seed/matchmaking.ts` with a `deliveryFit` factor using `leadTimeDays` + new mock `onTimeRate` / `avgDelayDays` fields on `Entity`. Surface "Lead time fit" / "Reliable delivery" as new reasons.

## 4. Messaging & meeting requests across matches

New lightweight in-app comms layer (mock data, no backend writes — same pattern as existing seed):

- New route `src/routes/messages.tsx` — two-pane inbox:
  - Left: thread list grouped by matched org (avatar, last message, unread dot)
  - Right: selected thread with message bubbles + composer
- New route `src/routes/meetings.tsx` — list of meeting requests (Pending / Confirmed / Past) with org, proposed times, agenda, accept/decline buttons.
- Shared `MessageChannel` already exists — extend it for thread-style use, or add `ThreadView` + `MeetingRequestDialog` components.
- From the `MatchProfileSheet`:
  - **Message** → opens composer pre-addressed to that org, on send creates a thread in local seed store.
  - **Request meeting** → opens dialog (date, time, agenda, attendees) → adds entry to meetings list.
- Sidebar (`AppSidebar`) gets two new entries: **Messages** (with unread badge) and **Meetings**.

## Technical notes

- Mock data only; no Supabase changes this round. New seed files: `src/seed/messaging.ts` (threads + messages) and `src/seed/meetings.ts` (requests), both keyed by entity id so they work for every matched org.
- Extend `Entity` in `src/seed/types.ts` with optional `onTimeRate?: number`, `avgDelayDays?: number`, `deliveryTimeframeDays?: number`. Backfill defaults in `all-entities.ts`/per-entity overrides.
- Reuse shadcn `Sheet`, `Dialog`, `Tabs`, `Avatar` — no new deps.
- Update `src/seed/matchmaking.ts` weights + reasons; keep symmetric pair generation.

## Files

**Create**
- `src/components/dashboards/BrandDashboard.tsx`
- `src/components/dashboards/UpstreamSupplierDashboard.tsx`
- `src/components/dashboards/MillDashboard.tsx`
- `src/components/dashboards/FactoryDashboard.tsx`
- `src/components/dashboards/ServiceProviderDashboard.tsx`
- `src/components/dashboards/DashboardByType.tsx`
- `src/components/MatchProfileSheet.tsx`
- `src/components/MeetingRequestDialog.tsx`
- `src/components/ThreadView.tsx`
- `src/routes/messages.tsx`
- `src/routes/meetings.tsx`
- `src/seed/messaging.ts`
- `src/seed/meetings.ts`

**Edit**
- `src/routes/organizations.$id.tsx` — render `DashboardByType`
- `src/routes/matchmaking.tsx` — row click opens `MatchProfileSheet`
- `src/components/MatchmakingPanel.tsx` — card click opens sheet, add Message / Meeting buttons
- `src/routes/settings.tsx` — delivery & reliability card, new params + weight row
- `src/seed/matchmaking.ts` — add `deliveryFit`, new reasons, rebalance weights
- `src/seed/types.ts` — add delivery/reliability fields
- `src/components/AppSidebar.tsx` — Messages + Meetings nav

## Open questions

1. Should the **Messages** inbox be limited to orgs that appear in your matches, or open to any registered org?
2. For **Meeting requests**, do you want a simple list with accept/decline only, or a calendar-style view with available time slots?
3. For per-type dashboards, are the five variants above the right grouping, or do you want each `EntityType` (10 types) to have its own distinct layout?
