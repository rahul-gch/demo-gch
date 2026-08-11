# Fix: own organization opens as a public profile after login

## What's happening

Signing in as `projectmate57@gmail.com` lands on the read-only "Public organization profile" of `rahul gmbh`, even though that account is a real member (role `editor`) of that organization — confirmed in the database.

The organization workspace route decides between the internal workspace and the public profile by reading a cached membership list. Two problems make that check unreliable right after sign-in:

1. The membership lookup is cached under a key that is not tied to the signed-in user, and it is kept for 5 minutes. An earlier lookup made before the session token is attached (auth page, first paint after OAuth) stores an **empty** membership list, and the workspace route then reads that stale empty list.
2. The membership server function returns an empty list instead of an error when no authorization header is present, so "not signed in yet" is indistinguishable from "belongs to no organization" — and the empty answer gets cached as if it were true.

Result: the guard concludes "not a member" and redirects to the public directory view.

## The fix

- Scope the membership and platform-admin caches to the signed-in user id, and reuse the exact entries the authenticated layout already fetched, so the workspace route and the login gate always agree.
- Make the "no token yet" case a non-cached condition: when the membership call comes back without a verified session, do not persist it as a result the guard can act on; re-fetch with the session instead.
- Only redirect to the public profile when a membership list was genuinely resolved for the current user and does not include this organization.
- Refresh both caches on sign-in / sign-out so a session change never leaves the previous user's answers behind.

After this, logging in goes straight to the organization workspace for members, and outside visitors still get the public profile.

## Technical notes

- `src/routes/_authenticated.organizations.$id.tsx`: replace query keys `["my-org-memberships"]` / `["platform-admin"]` with the user-scoped keys already used in `src/routes/_authenticated.tsx` (`["my-org-memberships-gate", userId]`, `["am-i-platform-admin", userId]`), read `userId` from route context, and skip the redirect when the membership resolution was inconclusive.
- `src/lib/orgs.functions.ts`: keep the soft-auth behaviour for public pages but distinguish "unauthenticated" from "no memberships" in the returned shape so callers/guards can tell them apart.
- Invalidate both query keys in the existing `onAuthStateChange` handler.
- No database or RLS changes; no navigation or layout changes.
