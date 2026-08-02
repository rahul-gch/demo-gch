## Problem

Every link to another organization (Research Database "Open", Matchmaking, Map, Ecosystem cards) goes to `/organizations/:id`, which renders the full owner workspace: dashboard, projects, supply chain, compliance, requests, settings. Nothing checks whether the signed-in user is actually a member of that org, so an owner of "Rahul-ug Garments" gets an insider view of ACL IMPEX.

## What to build

**1. Public organization profile route** — `/directory/:id`

A new, read-only page with its own light shell (no org workspace sidebar; it renders inside the user's own context with a back link). Shows only public registry data:

- Header: logo, name, GCH number, entity type, tier, location, verification status badge
- About / description, website, region
- Capabilities, materials, product categories, specializations
- Certifications list (name + status only — no uploaded documents, no expiry evidence files)
- Public operations summary where reported: MOQ, lead time, capacity, on-time rate (shown as "Not reported" when empty)
- Actions: **Send message** and **Request meeting** (reusing the existing message/meeting flows, acting as the user's own org)

Explicitly NOT shown: NHRI internals and readiness breakdown, missing-data lists, AI command center, projects, requests, documents/compliance uploads, supply chain, members, activity, settings.

**2. Point all outward links at the public profile**

Update "Open"/profile links in `ResearchWorkspace`, `MatchmakingPanel` / `MatchProfileSheet`, `EcosystemConnections`, `SupplyChainSnapshot` / `RecommendedChain`, the map popups, and `organizations.index` (for non-admins) to `/directory/:id`.

**3. Guard the workspace route**

In `src/routes/_authenticated.organizations.$id.tsx`, the loader checks the user's memberships (`myOrgMemberships`) plus platform-admin status:
- member or platform admin → current workspace, unchanged
- otherwise → redirect to `/directory/:id`

This closes the hole for anyone typing the URL directly, and keeps admin behaviour as today.

## Technical notes

- Membership check runs server-side via the existing `myOrgMemberships` server function, cached through React Query so it doesn't refetch per navigation.
- Route file: `src/routes/_authenticated.directory.$id.tsx` (stays under the auth gate — the directory is not anonymous), component in `src/components/directory/PublicOrgProfile.tsx`.
- Data comes from the already-hydrated in-memory registry (`getEntity`) with the same `refreshRegistry` fallback the workspace route uses, so no new backend queries are needed.
- Row-level security on `orgs` already limits reads to authenticated users; this change is about what the UI exposes, so no migration is required. If you also want field-level restriction at the database layer later, that's a separate follow-up.
