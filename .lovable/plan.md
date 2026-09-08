# Fix local `permission denied for table orgs`

## Problem
Local dev is failing with:

```
permission denied for table orgs
hint: Grant the required privileges to the current role with:
      GRANT SELECT ON public.orgs TO authenticated;
```

The `authenticated` role has lost its `SELECT` privilege on `public.orgs`, so directory lookups and entity fetches cannot run.

## Diagnosis step
1. Query the current grants and RLS state on `public.orgs` to confirm exactly what privileges exist for `authenticated`, `anon`, and `service_role`.

## Fix
2. Run a migration that grants the minimum required Data-API privileges:
   - `GRANT SELECT ON public.orgs TO authenticated;`
   - `GRANT ALL ON public.orgs TO service_role;`
3. Leave RLS enabled and keep the existing scoped policies (platform admins, org members, connected orgs, public-profile column allowlist). The grant only lets the role attempt queries; RLS still controls which rows each user sees.

## Verify
4. Re-run the local page that loads `/organizations/:id` and confirm the directory/entity lookup succeeds without the `42501` error.
