# Platform Operations Console — Home Dashboard Upgrade

Scope: only `src/routes/index.tsx` (platform home) and new presentation components under `src/components/ops/`. Organization pages, navigation, sidebar, colors, typography, and card styles stay as they are. All data is derived from existing seed (`ALL_ENTITIES`, `showcase.ts`, `nhri.ts`, `dashboard-derive.ts`) — no backend, no new deps.

## What changes

### 1. Hero → "Platform Operations Center"
Rework the existing dark hero card in place (same shell, same spacing):
- Left: title "Platform Operations Center", subtitle line with live counts — Organizations, Countries, Active Projects, Verification Requests, Platform Health (avg NHRI).
- Right: "Today's Priorities" list (4 rows, colored dots, clickable) — waiting verification, expiring certs today, new matchmaking requests, delayed projects. Each links to the relevant route (`/organizations`, `/matchmaking`, etc.).

### 2. Quick Actions strip (new)
Horizontal row of 7 icon cards directly under the hero: Add Organization, Verify Organization, Create Project, Approve Partnership, Invite User, Send Broadcast, Upload Dataset. Static handlers (toast) for demo; wire targets to existing routes where they exist.

### 3. Platform Alerts panel (replaces AI Summary block)
6 alert rows with severity color chip (red/orange/blue/green): incomplete profiles, expiring certs, delayed projects, pending partner approvals, duplicate suppliers (AI), missing ESG data. Each row clickable → route.

### 4. Pending Approvals panel (new)
Table-style card with tabs: Verification, Projects, Partnerships, Org Updates, Invitations, Certificates. Each row: org, type, waiting time, priority chip, Approve / Review / Reject buttons.

### 5. Live Activity Feed (new, replaces current activity block)
Timeline grouped by time-of-day, org logo/initial + icon + text + timestamp. Filter chips (All / Uploads / Approvals / AI / Projects).

### 6. AI Operations Center (new)
Card listing 5 AI findings (duplicates, missing certs, partnership opportunities, suspicious ESG, incomplete supply chains) each with a Review button.

### 7. Platform Growth Analytics (upgrade existing KPI row)
Keep the row, but each KPI card gets a delta label (+N this month / +N%) and an inline sparkline (tiny SVG polyline, deterministic from seed).

### 8. Country Overview (new)
Ranked country list card (top 8 by org count derived from `ALL_ENTITIES`). Row click filters `/organizations?country=`.

### 9. System Status (new)
Small panel: API, Database, Storage (87%), Email, Matching Engine, AI Models — green/yellow dots. Static demo values.

### 10. User Overview (new)
Card with counts by role/type (Admins, Moderators, Brands, Suppliers, Research, NGOs, Auditors, Certification Bodies). Derived from entity types + fixed admin counts. Rows clickable.

### 11. Recent Requests (new)
Compact list of newest incoming requests with type, status chip, and age.

### 12. Scheduled Jobs (new)
"Tonight" list with job name and time (Supply Chain Refresh 23:00, AI ESG Scoring 01:00, etc.).

### 13. Footer status bar (new)
Thin footer row: Platform Version, Last AI Update, Last DB Sync, Last Backup, Uptime.

## Layout

```text
┌─────────────────── HERO (unchanged shell) ───────────────────┐
│  Ops Center + counts        │  Today's Priorities            │
└──────────────────────────────────────────────────────────────┘
┌─── Quick Actions (7 icon cards, horizontal scroll on sm) ────┐
┌── Platform Alerts ──┐┌── Pending Approvals ─────────────────┐
│                     ││                                       │
└─────────────────────┘└───────────────────────────────────────┘
┌── AI Operations ────┐┌── Live Activity Feed ────────────────┐
└─────────────────────┘└───────────────────────────────────────┘
┌── Growth KPIs (row of cards with sparklines) ────────────────┐
┌── Countries ────────┐┌── System Status ─┐┌── Users ─────────┐
└─────────────────────┘└──────────────────┘└──────────────────┘
┌── Recent Requests ──┐┌── Scheduled Jobs ────────────────────┐
└─────────────────────┘└───────────────────────────────────────┘
┌── Footer status bar ─────────────────────────────────────────┐
```

Existing "Featured Network Passports" block stays where it currently is (kept as-is). Organization registry table stays at bottom above the footer.

## Files

**New components (`src/components/ops/`)**
- `PriorityList.tsx`, `QuickActions.tsx`, `PlatformAlerts.tsx`, `PendingApprovals.tsx`, `LiveActivity.tsx`, `AIOperations.tsx`, `GrowthKpis.tsx` (with inline `Sparkline`), `CountryOverview.tsx`, `SystemStatus.tsx`, `UserOverview.tsx`, `RecentRequests.tsx`, `ScheduledJobs.tsx`, `OpsFooter.tsx`.

**New derivation helper**
- `src/lib/ops-derive.ts` — pure functions computing priorities, alerts, approvals queue, activity, AI findings, country ranks, user counts, requests, jobs. All from `ALL_ENTITIES` + deterministic mock seeds.

**Edited**
- `src/routes/index.tsx` — rewire hero content, insert new sections in the order shown above, remove the old AI summary block and old activity block that these replace.

## Guardrails
- No changes to navigation, sidebar, org routes, backend, or seed sources of truth.
- Reuse existing shadcn primitives (Card, Button, Badge, Tabs) and current color tokens; no hardcoded hex.
- All new panels are pure presentation with typed props; helpers in `ops-derive.ts` are unit-friendly.
- Every clickable row uses TanStack `Link` to an existing route (no dead links).
