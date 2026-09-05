# Admin dashboard: live data only

The platform-admin home (`/`) mixes real registry data with invented numbers. Audit of the current page:

**Live today (kept)**
- Organization / country counts, entity-type breakdown, registry preview table, global map, top countries — all derived from the real organization registry.
- Quick actions (already point at real pages).
- Top performers (NHRI) — computed from real organization profiles.

**Invented / hard-coded (removed or replaced)**
- Hero stats "Active projects: 14", "Verification requests: pending + 3".
- Today's priorities ("2 certificates expire today", "4 new matchmaking requests", "1 delayed project").
- Platform alerts (all six lines are fixed text).
- Pending approvals table (randomly generated rows across tabs).
- AI operations findings ("17 duplicate suppliers", etc.).
- Live activity (static list: Nike, PUMA, Adidas...).
- Growth KPIs (Projects 14, Messages 486, Partnerships 92, Compliance 78 with random sparklines).
- System status, Scheduled jobs, footer (version, uptime, last backup).
- User overview ("Admins 4, Moderators 9, NGOs 4, Auditors 3").
- Recent requests (random).
- Benchmark intelligence (static H&M / Inditex KPI dataset).
- Featured passports (hard-coded brand IDs: Nike, H&M, M&S, Primark...).

## New layout

```text
Hero: Organizations · Countries · Members · Active projects · Open requests · Errors (24h)
Today's queue (real):  pending connection requests, pending meeting requests,
                       sample orders awaiting quote/confirmation, unclaimed orgs,
                       orgs that never finished onboarding, unresolved app errors
Quick actions (unchanged)
Recent activity (real) | Recent signups (real, already exists in admin functions)
Growth (real, 30-day): new orgs, new members, messages, feed posts, connections made
Countries (live) | Members by role (live) | Network map (live)
Top performers (NHRI) | Registry preview | Entity breakdown
```

Each queue row links to the page where the admin can act (organizations list, admin invites tab, logs page, etc.). Empty states read "Nothing pending" rather than showing filler.

## Technical notes

- New `getAdminDashboardStats` server function in `src/lib/admin.functions.ts` (admin-only via `assertAdmin`), returning counts in one call: `orgs`, distinct countries, `org_members` (total + by role), `projects` (status active), `org_connections` pending, `meeting_requests` pending, `sample_orders` by status, `platform_invites` open, orgs with no members (unclaimed), orgs with `onboarding_completed_at IS NULL`, `app_errors` unresolved / last 24h, and 30-day counts for orgs, members, `messages`, `feed_posts`, accepted connections (plus the previous 30 days for a delta).
- Recent activity uses the existing `listPlatformActivity`; recent signups uses the existing `listRecentSignups`.
- `src/lib/ops-derive.ts`: delete the fabricated generators (`todaysPriorities`, `platformAlerts`, `pendingApprovals`, `liveActivity`, `aiFindings`, `growthKpis`, `systemStatus`, `userOverview`, `recentRequests`, `scheduledJobs`, `footerStatus`, `platformCounts`) and the PRNG; keep `QUICK_ACTIONS`, `topCountries`, and the shared types.
- `src/components/ops`: remove `PendingApprovals`, `AIOperations`, `SystemStatus`, `ScheduledJobs`, `OpsFooter`, `RecentRequests`; rewrite `PriorityList`, `LiveActivity`, `GrowthKpis`, `UserOverview` to take live data via props; add `RecentSignups` and `AdminQueue`.
- `src/routes/_authenticated.index.tsx`: drop `BenchmarkIntelligence`, the featured-passports section and the `COMPANY_BENCHMARK` / hard-coded ID imports; load stats with `useQuery` (admin-only functions must not run in the loader).
- No database changes. Seed files under `src/seed/kpi` stay untouched (still used by organization KPI pages).
