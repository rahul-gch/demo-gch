# Separate account creation from organization setup

Right now signing up mixes "create an account" and "create an organization" into one form, so a brand-new user like rahulinberlin@gmail.com can end up on a public organization profile instead of an onboarding step. This plan splits the two and adds a dedicated first screen.

## 1. Account first, organization second

- `/signup` becomes account creation only: first name, last name, work email, password, consent checkboxes. No organization fields.
- After the account exists (or after Google sign-in), the user is sent to a new **Welcome** screen at `/welcome`.

## 2. New Welcome screen — choose a path

Two large cards:

- **Create a new organization** — opens the short org form (name, entity type, country/city, optional website), then continues to the existing entity-specific profile wizard.
- **Join an existing organization** — paste an invite link or token (the current invite form), which routes to the existing invite acceptance flow.

Plus a sign-out link and the signed-in email for clarity.

## 3. Always gate users with no organization

Any signed-in user with zero memberships is redirected to `/welcome` from anywhere in the app, until they create or join one. Platform admins are exempt.

## 4. Admin: remove the Approve action

In the admin Pending approvals card, the green **Approve** button is removed. The Partnerships category and the Review / Reject actions stay as they are.

## Technical notes

- New route `src/routes/welcome.tsx` (signed-in, no org required); reuses `CreateOrgForm` (trimmed to org-only mode) and `JoinWithInviteForm` inside a choice step.
- `src/components/signup/CreateOrgForm.tsx` splits into: account creation (used by `/signup`) and organization creation (used by `/welcome`), keeping the existing `createOrg` server function and the redirect to `/organizations/$id/profile-setup`.
- Membership gate added in `src/routes/_authenticated.tsx` `beforeLoad`: call `myOrgMemberships()` + `amIPlatformAdmin()`; redirect to `/welcome` when both are empty/false, skipping the redirect when already on `/welcome`.
- `src/routes/_authenticated.index.tsx` keeps its admin-console/first-org redirect logic; the no-membership branch now defers to the gate.
- `src/components/ops/PendingApprovals.tsx`: delete the Approve `<Button>` only.
- Also fixing an unrelated hydration warning on the auth page while in these files.
