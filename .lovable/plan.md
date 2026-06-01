# Replace demo data with real seed + signup-only auth

You skipped the CSV upload, so I'll proceed with a sensible default: seed a small set of **publicly-known, real-world** apparel-industry orgs and certifiers (no cartoon names like Acme/Wayne/Cyberdyne), and switch auth to signup-only. You can later edit any org via the org profile UI, or paste a CSV and I'll re-seed.

## 1. Remove all fake data

- **Delete** `src/lib/ecosystem-data.ts` hardcoded `ORGS`, `EDGES`, `USERS` arrays.
- **Delete** demo persona credentials and "Continue as Rahul / George / Maria" buttons in `src/routes/login.tsx` and `src/lib/auth.ts`.
- **Delete** the `ensureSeed` server function that bridged demo personas → Supabase Auth.
- **Wipe DB rows**: `TRUNCATE org_documents, org_members, orgs CASCADE;` plus delete the 3 demo `auth.users` (rahul@…, george@…, maria@…, admin@…).
- Any component that imported `ORGS`/`USERS` arrays now fetches from Supabase via server fns (`listOrgs`, `listEdges`, `listMembers`).

## 2. Seed real orgs (public record only)

A new server fn `seedRealOrgs` (admin-only, idempotent, callable from a one-time button) inserts these — all are real, publicly-listed companies/bodies in the apparel + certification space:

**Brands** — Patagonia (US), Eileen Fisher (US), Stella McCartney (UK), Veja (FR), Nudie Jeans (SE)
**Suppliers (Tier 2/3)** — Arvind Limited (IN), Welspun India (IN), Esquel Group (HK), Texhong Textile (CN), Calik Denim (TR), Continental Clothing (DE)
**Verifiers / certifiers** — Control Union, SGS, Bureau Veritas, Intertek, TÜV Rheinland
**Regulators / standards bodies** — Textile Exchange, GOTS (Global Standard gGmbH), ZDHC Foundation, Fair Wear Foundation

Each row has: real `name`, `country`, `type`, `tier`, public `website`, and `certifications` taken from each org's published certifications. No fake users, no fake confidence scores — `confidence`/`risk` start as `NULL` and only populate once real docs are uploaded.

Edges (supply / verification / partnership relationships) are seeded **only** where a public sourcing disclosure exists (e.g., Patagonia → Bureau Veritas verification, GOTS → Arvind certification). No invented edges.

## 3. Signup-only auth

- Login page becomes: email/password signup + Google OAuth (via Lovable broker + `configure_social_auth`).
- First action after signup: **"Create your organisation"** wizard (name, type, country, website). The signup user becomes that org's `owner`.
- No pre-existing org membership for new users.
- Admin role (for the `seedRealOrgs` button + viewing all orgs in `/admin`) is gated by the existing `user_roles` table — first user can self-assign via a one-shot button on a fresh DB, then it's locked.

## 4. UI cleanup

- `EcosystemGraph` / `EcosystemMap` / `UserDashboard` / `MessagesPanel` / matchmaking — all read live data from Supabase (server fns), no fallback to hardcoded arrays.
- Empty states: if a user has no org yet, dashboard shows "Create your organisation" CTA instead of demo data.
- `/how-it-works` updated: remove references to demo personas; explain that orgs are real and self-created.

## 5. Files touched

**Delete**: persona logic in `src/lib/auth.ts`, hardcoded arrays in `src/lib/ecosystem-data.ts` (file becomes types-only).
**New**: `src/lib/seed.functions.ts` (real-org seed), `src/routes/onboarding.tsx` (create-org wizard), `src/components/EmptyOrgState.tsx`.
**Modified**: `src/routes/login.tsx`, `src/routes/index.tsx`, `src/components/EcosystemGraph.tsx`, `src/components/EcosystemMap.tsx`, `src/components/UserDashboard.tsx`, `src/lib/matchmaking.ts`, `src/lib/messaging.ts`, `src/lib/org.functions.ts`, `src/routes/how-it-works.tsx`.
**Migration**: truncate + delete demo auth users.

## Open questions (won't block — sensible defaults applied)

- **Real members per org**: none seeded. Real members appear when real people sign up + are invited via the existing invite flow.
- **CSV import**: if you later paste a CSV, I'll add a one-shot `importOrgsCsv` server fn instead of re-running the public-record seed.

Want me to proceed with this, or first show you the exact list of 20 real orgs I'll seed?
