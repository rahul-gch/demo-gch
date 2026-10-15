# Security Review History

## 2026-10-15

Scope: Compared `docs_gch/security_findings_extracted.txt` with the current source and security migrations after commit `f130088`. Reviewed authentication middleware, RLS migrations, server functions, privileged Supabase access, invite handling, project mutations, messaging, notifications, feed actions, and redirect handling.

Validation:
- `npm audit --audit-level=moderate`: failed with 4 vulnerabilities (2 critical, 2 high) in `seroval`, `shell-quote`, `brace-expansion`, and `source-map-js`; npm reports fixes available through `npm audit fix`.
- `npm run lint`: non-zero; output includes existing TanStack Start `inputValidator()` deprecation warnings.
- `npm run build`: completed successfully, with dependency bundling warnings.

### Resolved

- **C1, GDPR organization-column leak:** `supabase/migrations/20261002000000_fix_c1_c4_security.sql` revokes broad `authenticated` access to `orgs` and grants an explicit non-sensitive column list. Private details remain behind `org_private_details()`.
- **C2, unauthenticated server functions and process-wide stores:** reviewed research, chain-storage, match-preferences, and matchmaking AI functions now use `requireSupabaseAuth`; organization reads/writes use membership or editor checks. No original cross-tenant Map stores remain in those functions.
- **C3, platform admin role writes:** the current codebase includes server-side admin checks and the database remediation protects `user_roles` in the documented security migration path. Live database policy still requires dashboard/Supabase verification.
- **C4, sender self-accepting connections:** recipient-only connection update policy is present in `20261002000000_fix_c1_c4_security.sql`; later lifecycle/key-lock triggers further protect organization IDs.
- **H2, meeting status bypass:** `src/lib/meetings.functions.ts` requires `actingOrgId`, verifies membership, and restricts cancellation to the requester or responses to the recipient.
- **H3, meeting requester spoofing:** `createMeetingRequest` verifies membership in `requesterOrgId`; migration `0012_security_lifecycle_guards.sql` also verifies `requested_by` and requester membership.
- **H4, feed post authorization:** creation verifies organization membership and deletion verifies author, organization manager, or platform admin.
- **Medium invite-token risk:** invite lookups require at least 16 characters and are rate-limited; acceptance is authenticated and rate-limited.
- **Admin activity authorization:** `listPlatformActivity` calls `assertAdmin`.
- **Message/notification organization checks:** list, read, and notification operations include membership or platform-admin checks.
- **Open-redirect risk:** `src/routes/auth.tsx` accepts only same-origin relative destinations and rejects protocol-relative URLs.
- **PostgREST filter injection in reviewed paths:** organization reference lookup uses separate parameterized filters; the admin hidden-organization path validates UUID/slug input before use.

### Pending

- **SEC-2026-10-01, privileged Supabase client fails open:** `src/integrations/supabase/client.server.ts` falls back from `SUPABASE_SERVICE_ROLE_KEY` to publishable keys and includes a hard-coded project URL/key fallback. This can make privileged operations silently run without service-role authority and is unsafe configuration hygiene. Fix by requiring `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` on the server, with no publishable-key or hard-coded fallback; fail startup/request clearly when missing.
- **SEC-2026-10-02, SECURITY DEFINER search path:** `is_org_owner(uuid, uuid)` and `user_can_view(uuid, uuid)` are created as `SECURITY DEFINER` without a migration containing `SET search_path = public`. Only `is_platform_admin` is explicitly altered in `0010`. Add a new migration that pins both functions and verify with Supabase Security Advisor.
- **SEC-2026-10-03, project mutation actor binding:** project mutation handlers generally call `assertProjectAccess`, but `setRequestStatusFn` and `addRequestCommentFn` authorize project membership without verifying that the supplied `requestId` belongs to the supplied `projectId`. RLS appears to provide an additional boundary, so exploitability is not confirmed from static review. Bind the target row to `projectId` in the query and return not-found/forbidden on mismatch; add cross-project tests.
- **Live C3/RLS/storage state:** source migrations cannot prove what is currently deployed in Supabase or what policies exist on dashboard-created objects. Verify `user_roles` write protection, all RLS policies, storage bucket privacy, leaked-password protection, OTP expiry, and browser-key referrer restrictions in the live environment.
- **Dependency vulnerabilities:** `npm audit --audit-level=moderate` currently reports 4 vulnerabilities: critical `seroval` and `shell-quote`, plus high `brace-expansion` and `source-map-js`. Review the dependency tree and apply/test the available fixes; do not blindly update production dependencies without a build and regression check.
- **Raw error exposure:** `RouteErrorFallback.tsx` still renders `errorMessage(error)` directly. Replace client-visible backend/database details with a generic message and keep details in server logs.
- **Sensitive broad selects:** `privacy.functions.ts` and several project handlers use `select("*")`. Confirm these responses never cross the client boundary with private columns; replace with explicit DTO columns where practical.

Remaining gaps: no live authenticated cross-tenant test was run, no Supabase Security Advisor result was available, and no production dashboard configuration was inspected.

## 2026-10-15 Follow-up

- Applied `npm audit fix`: the previous critical `seroval` and `shell-quote` issues and high `brace-expansion` and `source-map-js` issues were updated away.
- Remaining dependency result: 4 moderate `esbuild` findings through the legacy `drizzle-kit` dependency chain. npm recommends a breaking `npm audit fix --force`; this was intentionally not applied.
- Added `supabase/migrations/20261015010000_tighten_org_insert_policy.sql` to require `created_by = auth.uid()` for direct authenticated organization inserts.
- Hardened rate-limit IP selection to prefer Cloudflare and trusted proxy headers before `x-forwarded-for`. The limiter remains process-local; a shared production limiter is still recommended.
- Edited files pass diagnostics and the production build completed successfully.

## 2026-10-15 Directory Visibility Follow-up

- **Confirmed bug:** `/directory/$id` resolved organizations from a client registry that loaded hidden organizations because `listEntities()` did not filter `is_hidden`. A user who knew or guessed an organization identifier could open its normal profile page.
- **Application fix:** `src/lib/entities.functions.ts` now excludes hidden organizations from the directory registry.
- **Database fix:** `supabase/migrations/20261015020000_enforce_hidden_org_visibility.sql` replaces the broad authenticated `orgs` read policy. Hidden rows are now available only to the organization's members, platform admins, or connected organizations; visible rows remain available to authenticated directory users.
- **Verification:** edited TypeScript and migration files pass diagnostics; production build completed successfully.
- **Production action required:** apply the new migration to the live Supabase project before considering hidden organization profiles protected. Test both direct URL access and direct authenticated REST/API reads after deployment.
