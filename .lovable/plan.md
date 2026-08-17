# Isolated full-screen onboarding flow

Today onboarding lives inside the signed-in app: the org questionnaire runs at `/organizations/:id/profile-setup`, which sits under the authenticated org route and therefore renders inside `OrgShell` (sidebar + header). Org creation lives on `/welcome`. This plan moves the whole setup journey out of the application shell into a dedicated `/onboarding` experience with its own layout, guard and progress UI.

## 1. New onboarding area, outside the app shell

- New route group `src/routes/onboarding.tsx` (layout, no sidebar/header, renders `<Outlet />`) with children:
  - `/onboarding` — step 1, create organization (reuses the existing `CreateOrgForm` fields and `createOrg` server function).
  - `/onboarding/$id` — profile steps, reusing the existing entity-specific step definitions and `ProfileFieldGroup`.
- The existing `/organizations/:id/profile-setup` route redirects to the new onboarding route so old links and the current post-creation redirect keep working.
- `/welcome` keeps only the "create vs join an existing organization" choice; picking "create" sends the user into `/onboarding`.

## 2. Onboarding state and routing guard

Add an `onboarding_completed_at` timestamp on the organizations table (nullable). It is set when the user finishes (or explicitly finishes later on) the last step.

Guard behavior in the authenticated layout:

- No organization → `/welcome` (existing behavior).
- Organization exists, onboarding not complete → any protected route (`/`, dashboard, projects, settings, messages, etc.) redirects to `/onboarding/<org id>`.
- Onboarding complete → normal app.
- Platform admins and all existing organizations are exempt: existing rows get `onboarding_completed_at` backfilled in the same migration, so only newly created organizations enter the flow.
- Refreshing mid-flow keeps the user in onboarding; answers are saved per step, so progress survives reloads.

## 3. Full-screen layout design

`OnboardingLayout`: full viewport height, light neutral background, Global Chain Hub logo/wordmark top-left, sign-out link top-right, centered content capped at ~960px, white card with subtle border and shadow, generous spacing, responsive down to mobile (stacked fields, reduced padding, touch-sized buttons, no horizontal scroll).

## 4. Progress indicator

A shared header inside the card: "Step N of M" plus a dot-and-connector rail showing completed, current and remaining steps. Steps = organization creation + each entity-specific profile step, so the total adapts to the entity type. Clicking a completed dot jumps back.

## 5. Steps and navigation

- Step 1 fields unchanged: organization name, entity type, country, city/region, website (optional). On success the flow continues automatically into the profile steps for the new org.
- Profile steps keep the current questions per entity type, including markets & locations.
- Footer controls: `← Back` on the left; `Skip` and `Save & continue →` on the right. Continue validates, saves, advances; Back preserves entered values; buttons disable and show a spinner while saving to prevent duplicate submissions.
- Live profile completeness percentage stays visible.

## 6. Transitions and completion

- Fast, subtle fade/slide between steps with the card staying in place.
- Final step: save, mark onboarding complete, show a brief "You're all set — your organization profile is ready" state, then redirect to the organization dashboard, which is where the sidebar and header appear for the first time.

## Technical notes

- Migration: `alter table public.orgs add column onboarding_completed_at timestamptz`; backfill all existing rows with `now()`; new rows default to null. No new grants/policies needed (column on an existing table).
- New server function `completeOnboarding({ orgId })` in `src/lib/orgs.functions.ts`, guarded by the existing `user_can_edit` check; `myOrgMemberships` extended to return each org's `onboarding_completed_at` so the guard needs no extra round-trip.
- New files: `src/components/onboarding/OnboardingLayout.tsx`, `OnboardingProgress.tsx`, `OnboardingStepShell.tsx`, routes `src/routes/onboarding.tsx`, `onboarding.index.tsx`, `onboarding.$id.tsx`.
- `src/routes/_authenticated.tsx` `beforeLoad` gains the incomplete-onboarding redirect after the existing no-membership check; `/onboarding` lives outside `_authenticated` and does its own session check (same pattern as `/welcome`).
- Reuses `getProfileSteps`, `ProfileFieldGroup`, `computeProfileScore`, `saveOrgProfileAnswers`, `getOrgProfileAnswers`, `createOrg`, `refreshRegistry`. No dashboard or sidebar redesign.
