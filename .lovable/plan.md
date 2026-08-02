## Goal

Signing up becomes one short form: personal account details + minimal organization details (name, type). Everything else (logo, country, website, description, certifications, operations) is filled in later from Organization Settings. Google sign-in is removed everywhere.

## What changes

### 1. `/signup` — one combined onboarding form
Replace the current "sign in first, then create org in a tab" layout with a single card:
- Your name
- Work email
- Password + Confirm password
- Organization name
- Organization type (dropdown from the existing 25+ type list, with "Other" free text)
- One button: **Create account & workspace**

Flow on submit: create the account, then immediately create the organization, refresh the registry, and land the user on their new organization dashboard. Email auto-confirm is already on, so no inbox step is needed.

The "Join with invite" option stays, but as a small secondary link/tab rather than an equal-weight tab — invited users don't create an org.

If a signed-in user with no organization opens `/signup`, they see only the organization half of the form.

### 2. Remove Google sign-in
- `/auth`: drop the "Continue with Google" button, divider and Google icon; email + password only.
- `/signup`: drop the Google button and divider.
- Existing OAuth callback route stays in place (harmless) so any in-flight links don't 404.

### 3. Country no longer required at signup
Country moves to Settings. The organization-creation server function makes `country` optional so the shorter form validates.

### 4. Logo upload moves out of signup
Logo upload is removed from the signup form (it already exists in Organization Settings).

### 5. Settings stays the home for full details
No change needed — Organization Settings already persists identity, operations and capabilities.

## Technical notes

- `src/routes/signup.tsx`: rewritten as a single-step page; Google handler and tabs restructured.
- `src/components/signup/CreateOrgForm.tsx`: reduced to org name + type; accepts optional account-creation step so it can run both fields in one submit.
- `src/components/auth/EmailAuthForm.tsx`: unchanged for `/auth`; signup usage folded into the combined form.
- `src/routes/auth.tsx`: remove `lovable.auth.signInWithOAuth` usage and Google UI.
- `src/lib/orgs.functions.ts`: `country` becomes optional in `createOrgSchema`.
- Registry refresh (`refreshRegistry`) is kept after creation to avoid the previously-seen 404 on the new org route.
