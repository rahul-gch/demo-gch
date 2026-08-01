## What's wrong

"rahul gmbh" **was** created successfully — it exists in the database (created 09:27 UTC today). The problem is purely on the app side: the list of organizations is loaded once into an in-memory registry and cached for 5 minutes, and nothing refreshes it after a new organization is created.

Consequences:
- The new org is missing from Organizations / dashboards until a hard reload after the cache expires.
- Navigating to the new org's workspace throws 404: the org page looks the entity up in that stale registry, doesn't find the new id, and throws `notFound()`.

The same gap hits every entry point: individual signup (`/signup` → create org), invite acceptance (`/invite/$token`), and admin onboarding links (`/onboarding/$token`).

## Plan

1. **Refresh the registry after any org-creating or org-joining action.** After `createOrg`, `acceptInvite`, and `acceptPlatformInvite` succeed, invalidate and re-fetch the entities registry query, then navigate. Navigation waits for the refetch so the target org is resolvable.

2. **Make the org workspace self-healing instead of 404-ing.** In the org route loader, if the id isn't in the registry, force one registry refetch and look up again; only then throw `notFound()`. This covers deep links, page reloads, and orgs created in another tab or by an admin.

3. **Improve the not-found screen for org routes.** Instead of a bare 404, show "Organization not found or you don't have access" with links back to Organizations and Signup.

4. **Keep lists fresh.** Ensure the Organizations index and the admin onboarding console re-fetch on mount/focus so a newly added org shows up without a manual reload.

5. **Verify end to end** in the preview with the signed-in admin account: create an org from `/signup`, confirm it lands directly on its dashboard, appears in the Organizations list, and that reloading the URL still works; then repeat via an admin onboarding link.

## Technical notes

- Registry lives in `src/seed/all-entities.ts`, hydrated via `entitiesQueryOptions` / `ensureRegistry` (`src/lib/registry.ts`), and consumed synchronously by `getEntity(id)`.
- Fix points: `src/components/signup/CreateOrgForm.tsx` (line ~236), `src/routes/invite.$token.tsx` (line ~51), `src/routes/onboarding.$token.tsx` (accept handler), and the loader in `src/routes/_authenticated.organizations.$id.tsx`.
- Add a small `refreshRegistry(queryClient)` helper in `src/lib/registry.ts` that invalidates the query and re-hydrates, reused by all call sites.
- No database or RLS changes are needed — the row is present and readable.
