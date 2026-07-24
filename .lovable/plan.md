## Organization signup

Add a public `/signup` route that lets a newly signed-in user either create a brand-new organization (becoming its owner) or join an existing one via an invite. Existing users without any org membership are nudged to this route.

### 1. New public route: `/signup`

File: `src/routes/signup.tsx` (public — outside `_authenticated`).

Three tabs:
- **Create new organization** (default)
- **Join with invite** — form with a token field or "Paste invite link"; on submit, navigate to `/invite/$token`.
- **Have an account?** — link back to `/auth`.

Behavior:
- If the visitor is not signed in, show a "Sign in with Google to continue" CTA that runs `lovable.auth.signInWithOAuth("google", { redirect_uri: `${origin}/auth/callback?next=/signup` })`. Same CTA is reused for both tabs.
- Once signed in, the Create form is unlocked. On successful create, redirect to `/organizations/{id}`.

### 2. Create-org form

Fields (matches `orgs` schema + user answers):

Core (required):
- Organization name
- Slug (auto-generated from name, editable, uniqueness checked)
- Type (dropdown from existing entity types: Brand, Farmer, Ginner, Spinner, Fabric Mill, Dye House, Garment Factory, Logistics Provider, Certification Body, Sustainability Partner)
- Country
- Website (optional URL)

Profile detail (optional, collapsible "More details"):
- Description (textarea)
- Size (dropdown: 1-10, 11-50, 51-200, 201-1000, 1000+)
- Region
- Tier (1-4)
- Certifications (multi-select from a preset list; free-add allowed)

Logo upload (optional):
- Drag/drop or file picker, image only, max 2 MB.
- Uploaded to a new **public** `org-logos` storage bucket at path `{org_id}/logo.{ext}`.
- Stored URL saved to `orgs.logo_url` (new column).

Validation with Zod, inline errors, disabled submit while pending, toast on success/failure.

### 3. Server function: `createOrg`

New file: `src/lib/orgs.functions.ts` — `createServerFn` with `requireSupabaseAuth`.

Steps in one transaction-ish flow:
1. Validate input (Zod).
2. Ensure `slug` is unique (retry with `-2`, `-3` suffix, up to a small cap).
3. Insert into `orgs` with all provided fields.
4. Insert an `org_members` row with `user_id = context.userId`, `role = 'owner'`, `display_name` from the Google identity (`user_metadata.full_name` or email prefix), `avatar_url` from Google avatar if present.
5. If a logo was uploaded (client uploads first, passes the storage path), set `orgs.logo_url`.
6. Return `{ id, slug }`.

### 4. Route gating tweak

- `/signup` stays public.
- The existing `_authenticated` layout is unchanged.
- Add a small check on `/` and on `_authenticated.organizations.index.tsx`: if the signed-in user has zero `org_members` rows, show a banner "You're not part of any organization yet" with a "Create or join one" button → `/signup`. No forced redirect (avoids trapping demo browsing).

### 5. UI entry points

- `/auth` page: add a "New here? Create an organization" secondary link → `/signup`.
- `UserMenu`: add "Create new organization" item that links to `/signup`.
- Sidebar orgs list: append a "+ New organization" item at the bottom.

### 6. Database migration

- `ALTER TABLE public.orgs ADD COLUMN logo_url text;`
- No new RLS work needed for `orgs` insert: add an `INSERT` policy allowing any `authenticated` user to insert a row (WITH CHECK `true`), plus `UPDATE` policy for owners (uses existing `user_is_owner`). Existing `org_members` insert policy already covers the owner-membership insert when performed by the same user; if not, add a policy: authenticated users may insert an `org_members` row where `user_id = auth.uid()` AND they're inserting themselves as owner of an org that has no existing members (bootstrap-only).
- Grants already exist for `orgs` and `org_members`; no change.

### 7. Storage

- New bucket `org-logos`, public read. Created via `supabase--storage_create_bucket`.
- RLS on `storage.objects`:
  - Public SELECT for bucket `org-logos`.
  - INSERT/UPDATE/DELETE restricted to authenticated users where the top-level folder equals an `org_id` they can manage (`user_can_manage`).

### 8. Files touched

Created:
- `src/routes/signup.tsx`
- `src/lib/orgs.functions.ts`
- `src/components/signup/CreateOrgForm.tsx`
- `src/components/signup/JoinWithInviteForm.tsx`

Edited:
- `src/routes/auth.tsx` — add signup link
- `src/components/UserMenu.tsx` — add "Create new organization"
- `src/components/AppSidebar.tsx` — add "+ New organization" entry
- `src/routes/_authenticated.organizations.index.tsx` — empty-state banner
- Migration + storage bucket creation

### Out of scope

- Domain-based auto-join, request-to-join, org discovery/search, and org deletion. Join is strictly invite-only per your choice.
