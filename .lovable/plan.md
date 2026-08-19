# Error & activity logging (observability)

Right now, when something breaks the user sees "This page didn't load" and the failure disappears — nothing is stored, so there is no way to know what broke, for whom, or how often. This adds a single place where every failure is recorded and readable.

## What you get

1. **An `app_errors` table** in the backend storing every failure: message, stack, page URL, user id, org id, whether it came from the browser or the server, browser/user-agent, and time.
2. **Automatic capture** — no manual work per feature:
   - Browser: uncaught errors, unhandled promise rejections, and the route error screens (`RouteErrorFallback`, root `ErrorComponent`) report before showing the fallback.
   - Server: the existing error middleware in `src/start.ts` and the catch-all in `src/server.ts` record the error instead of only `console.error`.
3. **A "System logs" admin page** at `/admin/logs` (admin-only), with:
   - Filters: time range, source (browser/server), search on message/route, and "unresolved only".
   - Grouping by message so a repeated error shows a count instead of 200 rows.
   - Row detail: full stack, route, user/org, timestamp; a "Mark resolved" button.
   - A live counter of errors in the last 24h.
4. **Admin dashboard tile** — the existing System Status / Platform Alerts area gets a real "Errors (24h)" number linking to `/admin/logs`, replacing guesswork.

## Privacy and safety

- Errors are written through a dedicated insert path that scrubs anything looking like a token, password, key or session from the message and URL query string, same rules as the existing security log.
- Only platform admins can read `app_errors`; authenticated users can insert their own rows only. Logging never blocks or breaks a user flow — if writing the log fails, it is silently dropped.
- Rate-limited client-side (max ~10 reports per page load, deduped by message) so an error loop can't flood the table.

## Technical notes

- Migration: `create table public.app_errors` (id, occurred_at, source, message, stack, route, user_id, org_id, user_agent, resolved_at, resolved_by) + GRANTs (`insert` to authenticated, `select/update` to authenticated gated by `has_role(auth.uid(),'admin')`, `all` to service_role) + RLS policies + index on `occurred_at desc`.
- New `src/lib/error-log.ts`: browser-side `reportError()` with scrubbing, dedupe and cap; wired from `src/routes/__root.tsx` (window listeners) and the two error components.
- New `src/lib/errors.functions.ts`: `logServerError` (used by `start.ts` middleware) and admin-only `listAppErrors` / `resolveAppError` behind `requireSupabaseAuth` + admin check.
- New route `src/routes/_authenticated.admin.logs.tsx` with its own `head()` metadata, reusing the existing admin table/card patterns.
- No change to existing page flow or navigation other than adding the admin logs entry and the dashboard tile link.
