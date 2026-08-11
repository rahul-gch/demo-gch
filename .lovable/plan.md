# Add george@globalchainhub.io as admin + working password reset

## 1. Admin account for george@globalchainhub.io

That address does not exist yet (only rahul@ and maria@ do). Platform-admin rights are automatic for any confirmed `globalchainhub.io` address, so the only missing piece is the account itself.

- Create the account with a temporary password and a pre-confirmed email, so it counts as a platform admin immediately.
- Share the temporary password so George can sign in, and let him change it via the password-reset flow below.

## 2. Password reset, end to end

The pieces exist (a "Forgot password?" action on the sign-in form and a `/reset-password` page), but the flow has gaps:

- **Recovery link handling.** The reset page only checks for an existing session. Depending on the link format the email uses (`?code=`, `#access_token`, or `?token_hash=&type=recovery`), the session may never be established and the user sees "Open this page from the password reset link in your email." Handle all three link formats explicitly: exchange the code, read hash tokens, or verify the recovery token, and show a clear "link expired — request a new one" state with a resend button when it fails.
- **Consistent password rules.** The reset page currently requires only 8 characters while signup enforces stronger rules. Apply the same strength requirements and inline feedback here.
- **Clear request feedback.** After requesting a reset, show a confirmation panel ("Check your inbox for the reset link, it expires in 60 minutes") with a resend option, instead of only a toast.
- **After success.** Sign the user into their workspace and land them on their dashboard, with a confirmation message.

## 3. Verification

Run the full flow against the live app: request a reset for a test account, open the emailed link, set a new password, and confirm sign-in with the new password works and the old one is rejected.

## Note on email branding

Reset emails currently send from a default Lovable sender address, not from globalchainhub.io. They work as-is. If you want them to come from your own domain (and be styled with your brand), that needs a one-time sender-domain setup for globalchainhub.io — say the word and I'll add it as a follow-up.

## Technical details

- Create the user through the Auth Admin API from a server function (email confirmed, temp password); no schema change needed since `is_platform_admin` already covers the domain.
- Rework `src/routes/reset-password.tsx`: handle `code` (exchangeCodeForSession), hash `access_token`/`refresh_token` (setSession), and `token_hash` + `type=recovery` (verifyOtp); add expired/invalid and resend states.
- Reuse the signup password-strength helper in the reset form.
- Keep `redirectTo` at `${window.location.origin}/reset-password` in `src/components/auth/EmailAuthForm.tsx` and add the request-sent panel there.
