# End-to-end check: signup, sign-in and onboarding

Scope is the account and onboarding flows only. Organization creation stays open to any signed-in user, as it is today. Here is what I found and what I'll fix.

## 1. Sign-in page throws a hydration error

`/auth` is server-rendered but immediately does browser-only session work, which is producing the hydration error currently in the logs (visible flash / occasional blank render). `/auth/callback` and `/reset-password` have the same shape.

Fix: mark all three client-only, matching how `/signup` and `/welcome` already work.

## 2. Password reset accepts weak passwords

Signup enforces the full rule set (length, upper/lower case, number, symbol) but the reset page only requires 8 characters — so a reset can silently downgrade an account's password.

Fix: reuse the same validation, strength meter and rule list on the reset page.

## 3. Dead-end on an expired or directly-opened reset link

Right now the page just says "open this from the email link" with no way forward.

Fix: add an email field and a "Send me a new link" action on that state, so the user can recover without leaving the page.

## 4. Where reset lands you

After a successful reset the app sends everyone to `/`, which bounces users with no organization through an extra redirect.

Fix: route to the workspace when the user has an organization, otherwise straight to the get-started screen.

## 5. Smaller edge cases in the same flows

- Signing up with an email that already exists currently shows the raw backend message; it will show a clear "This email already has an account — sign in instead" with a link.
- Repeated forgot-password clicks can hit the email rate limit; the button gets a cooldown and a friendly message instead of a raw error.
- Invite join: valid, expired, revoked, already-used and malformed tokens each get a specific message (mostly already handled — I'll verify each one rather than change it blindly).

## Verification pass

After the fixes I'll drive the app headlessly and confirm, with the console clean of hydration and runtime errors:
- New signup → confirmation state → welcome screen with both create and join options.
- Sign in, sign out, sign in again.
- Forgot password → reset link → new password → correct landing page.
- Reset page opened directly and with an expired link.
- Duplicate-email signup, weak-password signup, mismatched confirm password.
- Invite join with valid, expired, revoked and garbage tokens.

## Technical notes

- Files touched: `src/routes/auth.tsx`, `src/routes/auth.callback.tsx`, `src/routes/reset-password.tsx`, `src/components/auth/EmailAuthForm.tsx`.
- No database migration and no navigation or page-structure changes.
