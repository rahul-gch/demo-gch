## Real authentication + invites

Replace the placeholder `/auth` page with a working Google-based login, gate the whole app behind it, and add an invite system (email + shareable link) so managers can bring team members into their organizations with a role.

### 1. Auth setup
- Enable Google OAuth via `supabase--configure_social_auth` (`providers: ["google"]`).
- Sign in uses `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback" })`.
- New public routes:
  - `/auth` — Google sign-in button + shows current sign-in state.
  - `/auth/callback` — waits for Supabase session, then redirects to the stored `next` path (defaults to `/`).
  - `/invite/$token` — public invite acceptance page (see §3).
- Add a lightweight auth context in `__root.tsx`: subscribes once to `supabase.auth.onAuthStateChange` (filtered to `SIGNED_IN`/`SIGNED_OUT`/`USER_UPDATED`), calls `router.invalidate()`, and exposes `{ user, loading }` via route context.

### 2. Route gating
- Introduce a pathless `_authenticated` layout (`ssr: false`, `beforeLoad` calls `supabase.auth.getUser()`, redirects to `/auth?next=…` when missing).
- Move every existing app route under it:
  - `index.tsx`, `feed.tsx`, `map.tsx`, `matchmaking.tsx`, `meetings.tsx`, `messages.tsx`, `settings.tsx`, and the entire `organizations.*` tree.
- Public routes remaining outside the gate: `/auth`, `/auth/callback`, `/invite/$token`.
- Update `AppSidebar` / `AppShell` to show the signed-in user (email + avatar) with a "Sign out" action that follows the sign-out hygiene (cancel queries → clear cache → `signOut()` → replace-navigate to `/auth`).

### 3. Invite system
Two ways to invite, both landing on `/invite/$token`:

**A. Email invite with role** (manager fills email + role in Org → Settings → Members)
- Creates an `org_invites` row with a unique token, target email, org, role, `expires_at` (14 days), `invited_by`.
- Sends the invite email via an existing Resend/Lovable Emails path (fallback: show the copyable link in the UI if email isn't configured).

**B. Shareable invite link** (manager generates a link with a chosen role)
- Same table, but `email` is null and `max_uses` / `uses` track usage; role is fixed on the link.

Accept flow (`/invite/$token`):
1. Public loader fetches invite metadata (org name, role, whether it's email-locked, expiry) via a public server fn — does not require auth.
2. If not signed in → "Sign in with Google to join {Org}" (preserves `next=/invite/<token>`).
3. If signed in → shows org + role, "Accept invitation" button.
4. Accept calls a `requireSupabaseAuth` server fn that validates the token, checks email match (for email invites), enforces expiry/uses, then inserts into `org_members` (upsert on `(org_id, user_id)`), increments `uses`, and marks single-use invites `accepted_at`. Redirects to `/organizations/{id}`.

### 4. Members management UI
In `organizations.$id.settings.tsx` (managers/owners only, checked via existing `user_can_manage`):
- **Members list**: existing `org_members` rows with role dropdown + remove button.
- **Pending invites list**: outstanding rows from `org_invites` with copy-link, resend, revoke.
- **Invite form**: email + role → sends email invite; "Create shareable link" → generates link-invite.
- Non-managers see a read-only members list.

### 5. Data model
New migration adds:
- `org_invites` (`id`, `org_id` FK, `email nullable`, `role org_role`, `token text unique`, `invited_by`, `expires_at`, `max_uses int default 1`, `uses int default 0`, `accepted_at`, `revoked_at`, `created_at`).
- Grants + RLS:
  - `SELECT/INSERT/UPDATE/DELETE` to `authenticated`, `ALL` to `service_role`.
  - Managers can select/insert/update/delete invites for their orgs (via `user_can_manage`).
  - Public accept: a `SECURITY DEFINER` RPC `get_invite_by_token(text)` returns non-sensitive fields (org name, role, expiry, is_email_locked) without needing table SELECT for anon.
- Existing `org_members` policies already allow managers to insert/update/delete — accept flow uses the authenticated user's own client so the manager-created invite is consumed via a `SECURITY DEFINER` function `accept_invite(token text)` that performs the insert on behalf of the user (validating token + email match server-side).

### 6. First-run: bootstrapping org ownership
Because signup is open with no auto-assigned org, we need at least one path in:
- Keep the existing seeded orgs viewable (public SELECT on `orgs` already exists).
- Users get into an org only via invite. Document this on `/auth` ("Ask your org admin for an invite").
- Existing seed data has no `org_members` rows for real users — add a small "Claim demo org" affordance only if you want it; **not included by default** to keep behavior predictable. Confirm on approval if you want a seeded owner claim.

### Technical details

- **Files created**: `src/routes/_authenticated/route.tsx`, `src/routes/auth.tsx` (rewrite), `src/routes/auth.callback.tsx`, `src/routes/invite.$token.tsx`, `src/lib/invites.functions.ts`, `src/lib/auth-context.ts`, `src/components/UserMenu.tsx`, `src/components/settings/MembersPanel.tsx`, `src/components/settings/InviteForm.tsx`.
- **Files moved under `_authenticated/`**: all current top-level app routes and the `organizations.*` tree (rename only; content unchanged).
- **Migration**: creates `org_invites` with grants + RLS, plus `public.get_invite_by_token(text)` and `public.accept_invite(text)` `SECURITY DEFINER` functions with `search_path = public`. Grant `EXECUTE` on `get_invite_by_token` to `anon, authenticated` and on `accept_invite` to `authenticated`.
- **Middleware**: `src/start.ts` already registers `attachSupabaseAuth` — no change.
- **Root**: add a single `onAuthStateChange` subscriber in `__root.tsx` that filters events and calls `router.invalidate()`; teardown on unmount.
- **Sign-out**: uses `queryClient.cancelQueries()` → `queryClient.clear()` → `supabase.auth.signOut()` → `navigate({ to: "/auth", replace: true })`.
- **Email sending**: use Lovable Emails if a domain is already verified; otherwise show the invite link in-UI with a "Copy link" fallback and a note that email dispatch needs a verified domain. I'll check `email_domain--list_email_domains` at build time and pick the working path automatically.
- **No auto-confirm signup, no anonymous users.**
