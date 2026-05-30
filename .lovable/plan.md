# Demo Login for 4 Roles

Add a simple front-end-only login gate so each persona has their own credentials. After login, the existing dashboard loads with that role pre-selected. The current top-bar role switcher stays (useful for demos) but defaults to the logged-in role.

## Demo Credentials

| Role | Username | Password |
|---|---|---|
| GCH Admin | `admin` | `admin` |
| Rahul (Brand Lead) | `rahul` | `rahul123` |
| George (Supplier Ops) | `george` | `george123` |
| Maria (Evidence Reviewer) | `maria` | `maria123` |

## What gets built

1. **Login page** (`/login` route)
   - Clean, premium card matching current dashboard style
   - Username + password fields, "Sign in" button
   - Inline error on bad credentials
   - Small "Demo accounts" helper panel listing the 4 logins (click-to-fill) so it's frictionless for demo
   - GCH branding header

2. **Auth state** (lightweight, client-only)
   - `localStorage` key stores the logged-in role
   - Simple `useAuth()` hook with `user`, `login()`, `logout()`
   - No backend, no Lovable Cloud — pure prototype auth

3. **Route protection**
   - `/` redirects to `/login` if not authenticated
   - `/login` redirects to `/` if already authenticated

4. **Dashboard updates** (`src/routes/index.tsx`)
   - Initial active role = logged-in user's role
   - Header shows logged-in user name + "Sign out" button
   - Role switcher remains for cross-role demoing

## Files

- **Create** `src/routes/login.tsx` — login page
- **Create** `src/lib/auth.ts` — credentials map + tiny auth helpers
- **Edit** `src/routes/index.tsx` — read logged-in role, add sign-out, redirect when unauthenticated

## Out of scope

No real authentication, hashing, sessions, or Lovable Cloud — this is a demo gate only. We can swap in real auth later when you're ready.
