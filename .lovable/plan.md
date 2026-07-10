
## Goal

Sweep the entire admin app for responsive layout bugs and text/line alignment issues so every page holds together from ~360px mobile up to wide desktop. No feature or visual-language changes — same colors, spacing scale, typography, cards.

The screenshot you shared shows the two classes of bugs I'll target everywhere:
- Text overflowing its container (org names like "KUMARAN TEXTILES (Units 2, 3, Kumaran Sizing Mills…" bleeding into the priority pill and action buttons).
- Rows that don't reflow: pill + Approve/Review/Reject buttons stay on one line and push into the title instead of wrapping.

## Scope (every route + shared shell)

Admin shell: `AppShell`, `AppSidebar`, sticky header.

Admin pages: `/` (ops console), `/feed` (Activity + Community tabs), `/organizations`, `/organizations/$id` and all its sub-routes (index, projects, projects/$projectId/*, matchmaking, messages, meetings, requests, research, settings, supply-chain, compliance, circularity, feed), `/matchmaking`, `/messages`, `/meetings`, `/map`, `/settings`, `/auth`.

Shared components: everything under `src/components/ops/*`, `src/components/dashboard/*`, `src/components/feed/*`, `src/components/messages/*`, `src/components/projects/*`, plus the top-level cards (`KpiTable`, `KpiSnapshot`, `BenchmarkChart`, `ActivityFeed`, `MatchmakingPanel`, `NetworkPassport`, `OrgShell`, `OrgSidebar`, `ReportUploader`, `ResearchWorkspace`, `EcosystemGoogleMap`, `EcosystemConnections`, `DashboardByType`, `MiniDashboard`, `DocumentsList`, `MeetingRequestDialog`, `MatchProfileSheet`, `MessageChannel`).

## Fix patterns to apply consistently

Applied per the project's `responsive-layout-patterns` rule.

1. Row layouts with title + widgets (approvals, alerts, feed items, project rows, message list items, org cards):
   - Wrap outer row in `grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:flex-wrap items-center gap-3`.
   - Text column gets `min-w-0`; titles get `truncate` (single line) or `line-clamp-2` (multi-line).
   - Icons/avatars/badges get `shrink-0`.
   - Action button clusters wrap to the next line on mobile via `flex flex-wrap gap-1 sm:justify-end`.

2. Pending Approvals card (visible bug in screenshot):
   - Two-line stacked layout on mobile: title row on top, priority + actions row below.
   - Truncate long org names with a `title` attribute for full text on hover.
   - Tabs list already uses `flex-wrap` — verify chip spacing at 360px.

3. Grids:
   - KPI/stat grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` instead of jumping straight to 5.
   - Dashboard two-column areas: `grid-cols-1 lg:grid-cols-2` with `min-w-0` on each cell so charts and long names don't force horizontal scroll.

4. Headers and page titles:
   - `flex flex-wrap items-center justify-between gap-3` with `min-w-0` on the title block and `truncate` on H1s.
   - Sticky admin header: `min-w-0` on the label, hide the "Global Chain Hub · Admin" secondary text below `sm:`.

5. Sidebar:
   - Ensure `SidebarProvider` collapses to icon-only under `md:`; verify no nav label overflows.

6. Tables / long lists (`KpiTable`, requests, documents, priority list):
   - Wrap in `overflow-x-auto` with `min-w-full` inner table so mobile scrolls horizontally instead of squishing cells.
   - Or convert to stacked card view under `sm:` where a table isn't essential (priority list, recent requests).

7. Feed pages:
   - Filter chip rows: already `flex-wrap` — audit gap and tap targets.
   - Event rows: apply row-layout pattern above so badges + meta wrap under the title on narrow screens.

8. Chat / messages:
   - Conversation list: `min-w-0` + `truncate` on names and previews.
   - On mobile: single-column with a back button instead of side-by-side list + thread.

9. Charts (`BenchmarkChart`, sparklines):
   - Wrap in `w-full` container with a min-height; ensure SVGs use `viewBox` + `preserveAspectRatio` (sparklines already do).

10. Alignment nits:
    - Numbers → `tabular-nums`.
    - Icon + text rows → `inline-flex items-center gap-1.5` (baseline-safe).
    - Card headers with trailing meta → `flex items-center justify-between gap-2`, title `truncate`, meta `shrink-0`.

## Verification

- Playwright screenshots at 360, 768, 1024, 1440 for: `/`, `/feed` (both tabs), `/organizations`, one org detail, `/messages`, `/matchmaking`.
- Visual check each screenshot for overflow, clipped text, buttons on top of text, horizontal scroll on `<body>`.
- `bunx tsgo` to confirm no type regressions.

## Out of scope

- No new features, no color/typography changes, no copy rewrites.
- No refactors beyond the class-list changes needed for the patterns above.
