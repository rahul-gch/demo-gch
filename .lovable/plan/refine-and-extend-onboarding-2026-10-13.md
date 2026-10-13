# Refine and extend onboarding

## 1. Clear entity label
- Remove the sparkle symbol next to “Manufacturer” and every other selected entity label.
- Use a compact amber-filled label with dark, readable text, using the existing GCH brand colours.
- Keep the shared text GCH wordmark and mobile-friendly layout; no emoji or image branding.

## 2. Working Back and review options
- Add an “Organization details” review screen before the tailored questions, showing the saved organization name, entity type and country, with optional description, website and city fields.
- Back from the first questionnaire section opens this review screen instead of remaining disabled. This does not restart signup or create another organization.
- Allow returning to earlier questionnaire sections through Back and the progress indicator, preserving answers. Save changes before moving between sections; show an error and stay put if saving fails.
- Keep organization type read-only in this change so reviewing details cannot silently invalidate existing answers.

## 3. Two additional tailored sections
- Expand from two questionnaire sections to four, with questions still drawn from each entity’s existing questionnaire.
- Keep “What you offer” and “Your capabilities” where applicable; organize remaining questions into two clear stages covering operations/markets and credentials/sustainability/partnership needs. Adapt these groups for entities without those categories.
- Split larger stages into small question batches so users never face one long form. Update the progress indicator to match the actual stages.
- Include the remaining relevant scoring categories rather than simply taking the first four categories, which may leave too much of the profile unanswered.
- Keep Skip, Finish later and dashboard access available at any completion level, as requested.

## 4. Honest completion toward more than 80%
- Continue displaying the real, existing weighted profile score; do not inflate it or change weights to meet the target.
- Show which unanswered details can help users reach more than 80%, with an optional final review before entering the dashboard.
- Reaching more than 80% depends on the answers supplied; skipping questions must not block dashboard access.
- Preserve the optional dashboard profile-completion panel for anything left unfinished.
- Questionnaire answers about certifications remain declarations, not admin approval or verified credentials.

## Technical details
- Reuse `entity-profiles`, the existing score calculation, and authenticated profile-save functions. Preserve legacy entity definitions, partial answers and permissions.
- Implement section grouping and navigation in focused onboarding helpers; keep profile details separate from questionnaire answers when saving.
- No database schema changes, new migrations, registration changes or credential-review changes are planned.

## Validation
- Test section grouping across all supported signup types and legacy Supplier profiles.
- Test that all applicable scoring categories are reachable, Skip permits completion below 80%, and more than 80% is attainable with sufficiently complete valid input under the unchanged scoring rules.
- Test that Back and revisiting stages preserve answers and do not duplicate organization creation.
- Verify an authenticated save → Back → revisit → dashboard flow, plus phone and desktop layouts and the amber entity label.