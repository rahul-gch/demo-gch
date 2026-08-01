## Goal

New organizations start with a clean, empty profile — no invented KPIs, activity, documents or threads. Messages and meetings run entirely off the database for every organization, old or new.

## 1. Distinguish seeded vs. new organizations

Imported/legacy organizations are flagged in the database by `legacy_id` (set during the registry import); organizations created through signup, invite or the admin console have none. Use that as the single source of truth via a small helper (`isSeededOrg(entity)`), exposed on the entity model.

## 2. Suppress synthetic content for new orgs

Every showcase/derive generator (`src/seed/showcase.ts`, `src/lib/dashboard-derive.ts`) currently fabricates KPIs, activity, documents, connections and opportunities from the org name. For non-seeded orgs these return empty results, and the consuming dashboard panels render an explicit empty state with a call to action ("Add your first certification", "Upload a document", "Complete your profile") instead of numbers:

- Passport cards, KPI grid, readiness breakdown, health score → show "Not enough data yet" with a link to Settings/Operations.
- Activity timeline, opportunities, ecosystem summary, supply-chain snapshot, documents → empty states.
- Missing-data panel stays active (it is genuinely useful for a blank profile).

Legacy imported orgs keep their existing demo content unchanged.

## 3. Remove messaging dummy data

- Delete the starter-thread seeding path: `ensureStarterConversations` in `src/lib/messaging.functions.ts`, the `STARTER_THREADS`/`starterAuthor` helpers in `src/lib/comms.server.ts`, and the seeding branch in `useConversations`.
- Delete the unused legacy `src/components/MessageChannel.tsx` and the `getMockMessages` generator.
- Clean up existing synthetic rows: remove message rows that have no `sender_user_id` (the machine-generated starter messages) plus the conversations left empty by that deletion.
- Messages page with no threads shows a plain empty state ("No conversations yet — start one from Matchmaking or an organization profile").

## 4. Make messaging and meetings correct for every org

- Acting-organization selection: on `/messages` and `/meetings`, when a user belongs to several orgs, add a compact org switcher instead of silently using the first membership; on org-scoped pages continue to act as that org.
- Conversation list currently drops any thread whose counterpart is missing from the in-memory registry, which can hide brand-new orgs. Resolve counterpart names from the database result itself (return counterpart name/logo from `listConversations`), falling back to the registry, so newly created orgs always appear.
- Same fix for meetings: counterpart name already comes from the joined `orgs` row, so verify no registry-dependent filtering remains in the meeting card and org info sidebar.
- "Send message" and "Request meeting" from Matchmaking / org profile create real rows and land on the live thread for any org, including one created minutes earlier.

## Technical notes

- No schema migration needed; only a data cleanup statement for the seeded message rows.
- Files touched: `src/lib/messaging.functions.ts`, `src/lib/comms.server.ts`, `src/lib/comms-types.ts`, `src/lib/use-comms.ts`, `src/seed/showcase.ts`, `src/lib/dashboard-derive.ts`, dashboard panels under `src/components/dashboard/`, `src/routes/_authenticated.messages.tsx`, `src/routes/_authenticated.meetings.tsx`, `src/routes/_authenticated.organizations.$id.messages.tsx`, deletion of `src/components/MessageChannel.tsx`.
