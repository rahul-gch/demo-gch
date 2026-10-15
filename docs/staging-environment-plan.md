# Staging Environment Plan

## Goal

Create a separate, production-like environment for testing migrations, authentication, RLS, storage policies, dependency upgrades, and release builds before production deployment.

Staging must use a different Supabase project, different storage buckets, different OAuth callback URLs, different API keys, and non-production data.

## Recommended Topology

- GitHub `main`: production release branch.
- GitHub `staging`: integration branch for approved fixes.
- Supabase project `global-chain-hub-staging`: staging database and storage.
- Lovable staging/preview project: points only to the staging Supabase project.
- Production Supabase project: remains isolated and is changed only after staging verification.

Do not use a production database clone containing real personal or confidential data unless it has been scrubbed and access-approved. Prefer schema plus synthetic seed data.

## One-Time Setup

1. Create a new Supabase project named `global-chain-hub-staging` in the same organization as production.
2. Record the staging project URL, publishable key, and service-role key in the staging deployment secret store. Never commit them.
3. Configure staging Authentication settings:
   - staging site URL
   - staging redirect URLs
   - test email provider or controlled test accounts
   - password and OTP policies matching production
4. Create staging storage buckets with the same private/public settings as production. Use only synthetic documents and images.
5. Create a separate Lovable project or deployment target connected to the staging Supabase project. Do not point the existing production Lovable project at staging.
6. Add staging-only OAuth callback URLs to each provider. Keep production callback URLs separate.

## Database Deployment

Use the Supabase migrations as the database source of truth. Before applying migrations:

```powershell
supabase login
supabase link --project-ref <STAGING_PROJECT_REF>
supabase db push
```

If the staging project already has schema drift, inspect it first and resolve the drift deliberately. Do not use a destructive reset against production.

Apply the latest security migrations in staging, especially:

- `20261002000000_fix_c1_c4_security.sql`
- `20261015000000_pin_security_definer_search_paths.sql`
- `20261015010000_tighten_org_insert_policy.sql`

The Drizzle migrations and Supabase migrations must not be applied independently to the same environment without checking which system owns each object.

## Staging Secrets

Required server secrets:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY` if AI features are enabled

Required browser configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` if maps are enabled
- `VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY` if organization logos are enabled

Use staging-specific keys. Restrict browser keys to the staging hostname and never expose service-role or AI keys through `VITE_` variables.

## Required Staging Tests

### Authorization

- User A cannot read User B's private organization fields.
- A sender cannot accept their own organization connection.
- A non-recipient cannot confirm or decline a meeting.
- A user cannot update another organization's project, request, document, or discussion.
- A caller cannot use another organization's `orgId` or `requesterOrgId`.
- A normal user cannot create or modify a platform-admin role.

### Privacy and storage

- Anonymous users cannot read private tables or private buckets.
- Reports, organization documents, and showroom images obey their intended organization/connection rules.
- Exported user data contains only the requesting user's permitted data.
- Error pages do not display database or stack-trace details.

### Release checks

```powershell
npm audit
npm run build
npm run lint
```

Treat unresolved critical or high dependency findings as release blockers. Review moderate findings and document accepted development-only risk.

## Promotion Process

1. Merge the security change into `staging`.
2. Deploy the staging application using staging secrets.
3. Apply migrations to staging.
4. Run the authorization, privacy, storage, and smoke tests above.
5. Review Supabase Security Advisor for staging.
6. Record the result in `docs/security-review-history.md`.
7. Create a reviewed pull request from `staging` to `main`.
8. Back up or snapshot production.
9. Apply the exact reviewed migrations to production.
10. Deploy production with production secrets.
11. Run a small production smoke test without using real customer data.

## Rollback

- Keep a database snapshot before production migrations.
- Prefer forward-fix migrations; do not edit already-applied migration files.
- Keep the previous application deployment available for application rollback.
- If a migration changes permissions, verify the effective policy in the live database after rollback or forward-fix.

## Ownership Boundaries

Local code changes can prepare migrations, tests, environment templates, and CI checks. Supabase/Lovable account actions still require an authorized project owner:

- create the staging projects
- configure deployment secrets
- configure OAuth and browser key restrictions
- apply migrations to hosted databases
- inspect Security Advisor and production settings
