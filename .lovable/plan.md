## Goal

Turn Global Chain Hub from a demo (data in code files + browser localStorage) into a real product: every organization, message, meeting, project, post, document and compliance record lives in the backend, shared across users, with genuine AI behind search, insights and document reading.

## Where things stand today

- ~135 organizations, KPIs, compliance records, projects, conversations and feed posts are hardcoded in `src/seed/*` (~15k lines).
- Messages, meetings, projects, feed and research runs persist to browser localStorage — nothing is shared between users, and everything is lost on a different device.
- Real backend today: organizations created via signup, members, invites, documents storage buckets.
- AI today: partner search is live; dashboard insights and match rationale are generated text/templates.

## Phase 1 — Data foundation (must come first)

Everything else depends on real organizations existing in the database.

- Extend the `orgs` table with the fields the seed profiles carry (entity type, city, coordinates, employees, KPI values, scores, contact info, banner images).
- New tables for the org-level detail: KPI values, benchmarks, specializations already partly present.
- One-time import of all seed organizations and their KPIs into the database, keyed by their existing IDs so no links break.
- Replace `getEntity` / `all-entities` lookups with backend queries (server functions + TanStack Query), keeping the same shapes so pages don't need rewriting.
- Seed files retired to a `scripts/`-style import source, not read at runtime.

Result: every org page, map pin, matchmaking row and dashboard reads live data, and any org can be edited by its members.

## Phase 2 — Messages + meetings

- Tables: conversations, participants, messages (with read state and attachments), meeting requests (proposed times, status, accept/decline, notes).
- Realtime message delivery, unread counts, per-org conversation lists.
- Meeting requests from matchmaking and profiles create real records both sides can see and respond to.
- Access rules: only participating orgs can read a thread.

## Phase 3 — Projects + requests

- Tables: projects, project members and roles, partners, discussions, documents, activity log, data requests (with due dates and status transitions).
- Replaces `use-projects.ts` localStorage store entirely; permissions panel becomes real (who can view/edit per project).
- Cross-org requests: an org can request data from a partner, the partner sees it in their inbox and responds.

## Phase 4 — Feed + notifications

- Tables: posts, comments, reactions, plus a platform activity/event log.
- Community feed = real posts by orgs; Activity feed = real events (signups, uploads, certificate expiries, project milestones).
- Notifications: a notification table + bell in the header; platform admin gets notified on every new org signup and sees a "recently joined" list.
- Admin role stored in a dedicated roles table (not on the profile), enforced server-side.

## Phase 5 — Compliance + documents

- Tables: social audits (with scores, findings, corrective actions), product certifications, transaction certificates — all with issue/expiry dates and linked files.
- Real uploads into the existing private storage buckets with signed-URL downloads.
- Expiry tracking drives the dashboard critical-actions strip and feeds notifications.

## Phase 6 — AI made real

- **Partner search + match rationale**: search parses intent, filters against actual database rows, and the model writes the "why this match" narrative from both orgs' real profiles.
- **Dashboard command center**: summarizes the org's own data — missing fields, expiring certificates, open requests, pending meetings — with actions that link into the app.
- **Document extraction**: uploaded certificates and audit reports are read by the model to pull issuer, standard, scope, issue and expiry dates, pre-filling the compliance form for the user to confirm.

## Technical notes

- All backend access through TanStack `createServerFn`; user-scoped reads through the authenticated middleware so row-level security applies as the signed-in user.
- Row-level security on every new table: org members read their org's data; public-safe fields (org profile, community posts) readable more broadly; nothing cross-org leaks by default.
- Every migration includes the required grants alongside its policies.
- AI runs server-side via the Lovable AI gateway; extraction results are always shown for confirmation rather than written blindly.
- Data reads move to TanStack Query with loader prefetching, so pages keep their current instant feel.

## Delivery

One phase per round. After each phase that module is fully working end-to-end and you can use it before we move on. Phase 1 is the largest single step because the data import underpins everything; phases 2–6 are each self-contained.
