## 1. Real signup page (email + password, plus Google)

Rework `/signup` and `/auth` so both offer two paths:

- **Email + password**: name, email, password (min 8, strength hint), confirm. Sign-up sends a confirmation email; the page then shows a clear "Check your inbox to confirm your email" state instead of pretending the user is signed in. Sign-in form on `/auth` with a "Forgot password?" link.
- **Continue with Google** stays as-is.

New public route `/reset-password` handles the recovery link and sets a new password.

On `/signup`, once the account is confirmed and signed in, the org form unlocks exactly as it does today.

## 2. Complete organization type list

The signup form's type list gets the missing categories:

Brand, Retailer, Manufacturer, Farmer, Ginner, Spinner, Weaver, Knitter, Fabric Mill, Dye House / Processing, Printing Unit, Garment Factory, Trims & Accessories Supplier, Trader / Agent, Recycler, Logistics Provider, Certification Body, Auditor / Inspection Body, NGO / Non-profit, Government / Regulator, Industry Association, Research / Academia, Technology Provider, Sustainability Partner, Other (free text).

Manufacturer-style types keep the adaptive fields (materials, capabilities, MOQ, lead time, capacity); brand/retailer types keep product categories and product types. "Other" reveals a text input for the custom type.

## 3. Platform admin

Admin is granted by verified email domain (default `globalchainhub.io`, easy to change).

- New `platform_admins` check backed by a `has_platform_role` database function that reads the signed-in user's **verified** email domain — unverified addresses never get admin.
- Admin-only UI appears in the main sidebar only for admins.

## 4. Admin console: onboarding & new organizations

New page `/admin/organizations` with:

- **Recent signups** — newest organizations and members, with created date, type, country, owner email, and claim status.
- **Send onboarding link** — enter an email, pick the org role, and generate a link. Two modes (both supported):
  1. *Link only* — a generic onboarding invite; the recipient signs up and creates their own org, pre-linked to the invite.
  2. *Create org shell* — admin fills name/type/country, an unclaimed org is created, and the invite link makes the recipient its owner on acceptance.
- Copyable link plus optional email send, list of pending/expired invites with revoke.
- **Add organization directly** — the same org form the signup page uses, so admins can add orgs without any invite.

Existing `/invite/$token` route handles acceptance; it gains a branch for platform onboarding invites (create-your-org vs join-this-org).

## Technical notes

- Migration: `platform_invites` table (email, role, optional target org, token, expiry, uses, status) with GRANTs + RLS restricted to platform admins; `is_platform_admin(uuid)` security-definer function checking `auth.users.email_confirmed_at` and email domain; allow platform admins to insert orgs and org_members via policy so admin-created orgs work.
- Auth config: email provider stays on with confirmation required (no auto-confirm).
- Server functions in `src/lib/admin.functions.ts` (list recent signups, create/revoke onboarding invite, admin-create org) all verify `is_platform_admin` before doing work.
- Org creation logic is extracted from `createOrg` so admin-create and self-signup share one code path.
