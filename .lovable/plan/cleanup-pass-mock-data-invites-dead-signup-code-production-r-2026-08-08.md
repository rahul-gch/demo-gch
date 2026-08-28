# Cleanup pass: mock data, invites, dead signup code, production readiness

Three cleanups you asked for, plus an end-to-end check of the signup → organization → workspace flow.

## 1. Purge remaining mock data

Seeded showcase orgs (the demo brands) keep their data. Everything generated for _real_ organizations gets removed:

- Community feed: today every organization gets 12 fabricated posts (site tours, fake webinars, stock photos/videos) written into browser storage on first visit. New organizations will start with an empty feed and a "Share the first update" prompt; posts users actually write are kept.
- Compliance page: fake social audits and transaction certificates are replaced with empty states for non-seeded organizations.
- Mini dashboard, supply-chain map, recommended chain, ecosystem summary: already blank for new orgs — verified and any leftover fallbacks removed.
- Research Workspace "Invite" button currently only shows a "coming soon" toast; it will open the real invite dialog instead.

## 2. Invite links that always resolve

Today pasting an invite guesses the type from the URL text, so a bare platform-invite token is looked up in the wrong place and reports "not valid".

New behaviour: paste a link _or_ a bare token, we check the organization invite first, then the platform invite, and route to whichever matches. If neither matches, a clear message says whether it is expired, already used, revoked, or unknown.

## 3. Delete the dead account-creation branch

The organization form still contains the old "create account and organization at once" path (sign-up, already-registered detection, auto sign-in). Since `/signup` now handles accounts, that branch is unreachable. It gets removed, leaving the form organization-only.

## 4. End-to-end pass for production

Walk the real flows in a browser and fix what breaks:

- Sign up → verify → welcome → create organization → profile wizard → dashboard
- Sign up → welcome → join with invite (both invite kinds)
- Existing user with several organizations: switcher, messages, meetings, notifications
- External user viewing another organization: public profile only, no internal data
- Platform admin: admin console, organizations list, invites

Also fixed along the way: the hydration warning on the sign-in page, and the plain link there that reloads the whole app instead of navigating.

## Technical notes

- `src/lib/use-feed.ts`: drop `seedFeedForOrg` seeding; keep localStorage persistence for user posts; delete `src/seed/feed.ts` once unreferenced.
- `src/components/compliance/CompliancePage.tsx`: gate `getMockSocialAudits` / `getMockTransactionCerts` behind `isSeededOrg`, add empty states.
- `src/components/ResearchWorkspace.tsx`: wire the Invite action to the existing invite dialog / `createInvite`.
- `src/components/signup/JoinWithInviteForm.tsx`: extract token, call `lookupInvite`, fall back to `getPlatformInviteByToken`, then navigate; surface status text.
- `src/components/signup/CreateOrgForm.tsx`: remove the `signUp` / auto sign-in branch and the `accountReady` toggle; require an existing session.
- `src/routes/auth.tsx`: replace the `<a href="/signup">` with `<Link to="/signup">`; fix SSR/client mismatch by rendering the same tree on both passes.
- No database or schema changes.
