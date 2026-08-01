## What I found

- The demo messages are **real rows in the database**, not code: 10 conversations and 24 messages were inserted by an earlier seeding migration (0 meeting requests). That's why they still show after the code-side mock data was removed.
- The onboarding page shows "Role: Owner" + "Active" badges because the invite record carries a `role` field, and the admin console has a role dropdown defaulting to `owner`.
- Email confirmation is required on sign-up, so on `/onboarding/<token>` the "Create account" button ends at the "Check your inbox" screen — the user never gets signed in, never reaches "Accept invitation", and never gets a profile. That matches "it's not coming to the next page".

## Plan

### 1. Remove all seeded messaging data
Migration deleting every seeded conversation, conversation participant and message (and any meeting requests) so all organizations — old and new — start with a genuinely empty inbox. Messaging then only ever shows real user-sent messages.

### 2. Simplify the onboarding invitation
- Drop the role concept from the onboarding UX: remove the role dropdown from the admin invite form and the "Role: …" / status badges from `/onboarding/$token`. Invites are always just "join the platform" (the underlying record keeps defaulting to owner of whatever org they create, but it's never shown or chosen).
- Reword the admin invite card and the onboarding card to plain platform-onboarding language.
- Invite list rows show email, expiry and status only.

### 3. Make the onboarding link actually work end to end
- Turn on automatic email confirmation so account creation from an invite link signs the person in immediately instead of stalling on "check your inbox".
- After sign-up/sign-in on the onboarding page, auto-accept the invitation (no extra click) and route the user straight to organization setup:
  - invite tied to an existing organization → its dashboard
  - open invite → the create-organization form, then their new org's dashboard
- Handle the Google path the same way (return from `/auth/callback` resumes the pending onboarding token).
- Show clear inline errors if the token is expired/revoked or the invited email doesn't match.

### Technical notes
- Migration: `DELETE FROM messages; DELETE FROM conversation_participants; DELETE FROM conversations; DELETE FROM meeting_requests;`
- `supabase--configure_auth` with `auto_confirm_email: true`.
- Files touched: `src/routes/onboarding.$token.tsx`, `src/routes/_authenticated.admin.organizations.tsx`, `src/components/auth/EmailAuthForm.tsx` (signed-in callback path), `src/lib/admin.functions.ts` (role optional in create-invite input).
