# Professional onboarding and optional profile completion

## Onboarding presentation
- Replace the globe/image-style header on all onboarding screens with the shared text **GCH | GLOBAL CHAIN HUB** wordmark, with the amber C.
- Improve text contrast, spacing, and question controls; remove decorative imagery and keep onboarding free of emojis.
- Keep the current short, skippable setup and existing navigation unchanged.
- Make the header, question options, and action buttons fit comfortably on mobile without clipping.
- Explain that remaining details can be completed from the dashboard rather than only from Settings.

## Optional dashboard panel
- Add a **Complete your profile** prompt for people allowed to edit the organization.
- Do not open questions automatically. A **Continue profile** button opens a dismissible guided panel.
- Derive questions from the existing entity-specific questionnaire, including unanswered questions skipped during initial setup.
- Show a few questions at a time, grouped by section, rather than the entire questionnaire.
- Preserve existing answers; save only the fields edited in the current panel through the existing permission-checked save flow.
- Support **Save & continue**, **Skip section**, and **Finish later**. Reopening resumes from unanswered questions, and saved answers remain editable in Settings.
- Keep business verification and audits/certificates/memberships in the existing readiness checklist, with access to the existing upload and review flows. No changes to approval rules or directory filters.

## Technical details
- Reuse `GchLogo`, `ProfileFieldGroup`, `getProfileSteps`, and the existing authenticated profile read/save functions.
- Add a small reusable unanswered-question selector and dashboard completion panel; use current organization edit permissions and wait for an authenticated session before requesting protected data.
- Retain the existing database schema and profile-answer format. No migrations, data replacement, or changes to legacy certifications.
- Add page-specific metadata to the affected dashboard route.

## Verification
- Test question selection across all 18 existing canonical entity types, including skipped setup fields and preservation of answered fields.
- Check onboarding on desktop and mobile for logo legibility, wrapping, and button layout.
- As a signed-in organization editor, open the optional panel, save an answer, close/reopen it, and confirm the answer persists in Settings.
- Confirm the panel is not forced open and users without edit permissions cannot submit answers.

## Scope
This updates presentation and progressive completion using the current questionnaire. Expanding to the workbook's 20-type taxonomy, changing authentication, and unrelated security or monitoring findings are not included.
