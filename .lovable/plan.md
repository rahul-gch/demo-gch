# Update organization choices on signup

## Requested changes
- Remove **Supplier** from the signup organization-type list.
- Add **Trims / Accessories**, **Agent**, and **Recycling Company** as separate choices.
- Keep **Seed** excluded from signup.
- Replace the **Acme Cotton Mills** example with **Organization name** in the empty name field.
- Keep the current page layout, branding, verification and login flow unchanged.

## Onboarding and existing organizations
- Give each new type relevant questions in the initial setup and optional dashboard profile-completion panel: products and production for Trims / Accessories; represented products, markets and services for Agent; accepted materials, processes and capacity for Recycling Company.
- Preserve existing Supplier organizations and their saved answers; removing the signup choice must not delete or automatically reclassify them.
- Recognize older labels such as Trader / Agent, Trims & Accessories Supplier and Recycler as their corresponding specific types, rather than the current generic Supplier or Clothing Banks questionnaire.

## Technical details
- Update the shared entity definitions and normalization in `src/lib/entity-profiles.ts`, and the signup choices and placeholder in `src/routes/signup.tsx`.
- Keep relevant organization classifications compatible in `src/lib/org-types.ts` so the new labels work with existing directory and showroom behavior.
- Use existing profile-answer storage and authenticated save functions. No database migration, permission changes or bulk data rewrite is planned.

## Verification
- Add tests for the signup choices, normalization of all three new types, legacy Supplier compatibility and entity-specific profile steps.
- Check the signup dropdown and name field in the preview, plus the new types’ setup and remaining-question flows.
- Confirm the page remains usable on small screens and has no new errors.