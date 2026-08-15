# End-to-end audit: signup, organizations, core flows

I walked through the auth/onboarding code, the organization access rules and the live database policies. Four real issues came out of it; everything else in those flows checks out.

## 1. Anyone can still create an organization (should be admin-only)

You asked earlier that only platform admins create organizations. That was never fully applied:

- The user menu still shows "Create new organization".
- The welcome screen still offers "Create a new organization" as one of two options.
- The `createOrg` backend function has no admin check.
- The database rule for inserting organizations currently allows **any signed-in user** (verified in the live policy list).

Fix:
- Remove the create option from the user menu; the welcome screen becomes invite-only, with a clear line explaining that organizations are set up by the Global Chain Hub team and how to request one.
- Add a platform-admin check inside `createOrg` so the API rejects non-admins.
- Replace the permissive insert rule with an admin-only one (admins keep full access through the existing admin org tools).

## 2. Sign-in page crashes hydration (blank-flash risk)

`/auth` is server-rendered but immediately does browser-only session work, which produces the hydration error currently in the logs. `/auth/callback` and `/reset-password` have the same shape. All three get marked client-only, matching `/signup` and `/welcome`.

## 3. Password reset accepts weak passwords

The reset page only requires 8 characters, while signup enforces the full rule set (length, upper/lower, number, symbol). The reset page will use the same `validatePassword` rules and show the same strength meter and rule list, so a reset can't downgrade an account's password.

## 4. Reset link edge cases

If the reset link is expired or opened directly, the page shows only a static sentence. It will instead offer a "Send me a new link" action, and after a successful reset it will route to the workspace only when the user has an organization (otherwise to the invite screen), so no one lands on a dead page.

## Verification pass

After the fixes I'll drive the app in a headless browser and confirm:
- Signup with a new email → lands on the invite-only welcome screen, no create option anywhere.
- Non-admin attempting the create API directly is rejected.
- Admin can still add organizations from the admin tools.
- Invite join flow with valid, expired, revoked and garbage tokens shows the right message each time.
- Sign in, sign out, forgot-password, reset-password.
- Opening another organization's profile as a non-member still shows the public directory view, and a member lands in their own workspace.
- Console clean of hydration and runtime errors on each of those pages.

## Technical notes

- Files: `src/components/UserMenu.tsx`, `src/routes/welcome.tsx`, `src/routes/auth.tsx`, `src/routes/auth.callback.tsx`, `src/routes/reset-password.tsx`, `src/lib/orgs.functions.ts`.
- One migration: drop `orgs insert by authenticated`, add an insert policy gated on `is_platform_admin(auth.uid())`. The existing owner-bootstrap rule on `org_members` still works because admin-created orgs record `created_by`.
- No navigation or page-structure changes beyond removing the create-organization entry points.
