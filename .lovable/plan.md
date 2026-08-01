## Problem (verified in code)

1. **Everyone lands on the admin console.** `src/routes/_authenticated.index.tsx` (route `/`) renders the "Global Chain Hub · Admin" Platform Operations Center with no admin check at all. The only admin check (`amIPlatformAdmin`) is used in `/admin/organizations` and to show one extra sidebar link. `AppSidebar` also hardcodes the subtitle "Admin Console" and shows Platform Dashboard / Organizations / Map / Matchmaking to every user.
2. **Signup is two disconnected steps.** `/signup` first makes the user create an account, then a long multi-step `CreateOrgForm` (type, country, certifications, materials, capabilities, product categories, logo…) before they can get in. Onboarding invites route to the same form.
3. **Org settings don't persist.** `/organizations/$id/settings` writes to a local in-browser override store, not the database, so "fill details later in settings" isn't actually possible yet.

## Plan

### 1. Gate the admin console
- Add a shared `useIsPlatformAdmin()` hook wrapping the existing `amIPlatformAdmin` server fn.
- In `/` (`_authenticated.index.tsx`): if the user is a platform admin, render the current ops console. If not, redirect them to their organization dashboard (`/organizations/$id`) using their first membership; if they have no org yet, send them to the org-setup screen.
- `AppSidebar`: split navigation into an admin set (Platform Dashboard, Activity Feed, Organizations, Map, Matchmaking, Admin console) and a member set (My organization, Messages, Meetings, Settings). Header subtitle becomes "Admin Console" only for admins, otherwise the org name.
- Keep server-side authority as-is: admin server functions already call `assertAdmin`, so this is presentation gating on top of enforced backend checks.

### 2. One-step signup
- `/signup` becomes a single screen: create account (Google or email) → immediately create the organization with just **name, type, country**.
- Remove the multi-step wizard from the signup path; `CreateOrgForm` is reduced to those three fields plus an optional logo. All remaining fields (description, website, size, certifications, materials, capabilities, product types, MOQ, lead time, capacity) move to Settings.
- After creation, refresh the registry (existing `refreshRegistry`) and land straight on the new org dashboard.
- If a signed-in user has no org, `/` sends them to this same short setup screen instead of a 404 or the admin console.
- Onboarding invite links (`/onboarding/$token`) keep working and feed into the same short setup.

### 3. Make Settings the real profile editor
- Rewrite `/organizations/$id/settings` "Profile" tab to load from and save to the database via an `updateOrg` server function (extending the existing one in `src/lib/orgs.functions.ts`), replacing the local override store for org-owned fields.
- Fields: name, type, country, region, city, website, description, size, logo, certifications, materials, capabilities, product categories/types, MOQ, lead time, capacity, on-time rate.
- Show a small "complete your profile" prompt on the org dashboard linking here, so new orgs know where to fill data.
- Only owners/admins of that org can save (enforced in the server function).

### Technical notes
- No schema changes needed — `orgs` already has every column the form writes.
- Admin identity stays the existing `is_platform_admin` RPC (globalchainhub.io emails); no client-side role storage.
- Redirects use TanStack `redirect()` in `beforeLoad` so no admin content flashes before the redirect.
