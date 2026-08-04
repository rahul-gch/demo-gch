# Short signup + entity-specific profile onboarding

## Goal

Keep account creation to one short screen, then guide every new organization through a questionnaire tailored to its entity type, score the resulting profile, and store all answers as structured data so matching can be built on top later.

## 1. Entity types

Replace the current 25-item type list with the 18 defined types:

Seed, Farmer, Research Institute, Ginner, Spinner, Mill, Dye House, Supplier, Manufacturer, Brand, Retailer, Logistics, Certifier, Auditor, NGO, Government, Investor, Clothing Banks.

Existing organizations keep whatever type string they already have (old labels are mapped to the closest new type for display and questionnaire selection, e.g. Fabric Mill to Mill, Garment Factory to Manufacturer, Certification Body to Certifier). Nothing is rewritten in the database.

## 2. Signup (short)

`/signup` collects only:

First name, Last name, Work email, Password, Organization name, Entity type, Country, City / Region, Website (optional).

Button: "Create Account". On success the user lands directly on the profile wizard instead of the dashboard.

## 3. Entity-specific profile wizard

New route `/organizations/:id/profile-setup` titled "Complete your Global Chain Hub Profile".

- Questions are driven by a per-entity-type definition covering exactly the fields listed for that type (Seed, Farmer, Research Institute, Ginner, Spinner, Mill, Dye House, Supplier, Manufacturer, Brand, Retailer, Logistics, Certifier, Auditor, NGO, Government, Investor, Clothing Banks). No irrelevant questions are shown.
- Grouped into short sections: What you do / What you offer / Capacity & terms / Markets & locations / Certifications / Sustainability / What you're looking for.
- Structured inputs wherever possible: multi-select chips with suggested options, number fields for capacity/MOQ/lead time, country multi-select, single-select for things like Organic/Conventional or OEM/ODM/Private Label. Free text only where genuinely open.
- Every step has "Skip" and "Save & continue"; progress is saved on each step, so users can leave and come back. A final screen shows the score and links into the dashboard.

Entry points: a banner on the org dashboard and a "Complete profile" button next to the score keep bringing users back until the profile is complete.

## 4. Profile score

Score 0-100 computed from the answers, using weighted categories:

Basic info 15, Products/materials/services 20, Capabilities 15, Capacity/MOQ/lead time 15, Markets/locations 10, Certifications 10, Sustainability 5, Business needs 10 — with per-entity-type weight overrides (Manufacturer favours capacity and capabilities, Brand favours sourcing requirements and products, Farmer favours crop/location/capacity/harvest, Certifier favours standards and accreditation, and so on).

Displayed as "Your Global Chain Hub Profile Score: 72%" with the missing items listed underneath ("+ Add production capacity", "+ Add certifications", "+ Add markets served") and a "Complete Profile" button that jumps straight to the relevant wizard step. The existing dashboard completeness card reads from this same score so there is one number everywhere.

## 5. Matching readiness

No AI matching engine is built now. Answers are stored in normalized, queryable fields (entity type, products, materials, capabilities, capacity, MOQ, lead time, location, markets, certifications, sustainability, needs) so a later match engine can compare a Brand's requirements against Manufacturer capabilities and produce a "Match Score: 87%".

## Technical notes

- Database: add a `profile_answers jsonb not null default '{}'` column and `profile_score int not null default 0` to `public.orgs`; existing well-known columns (materials, capabilities, certifications, moq, lead_time_days, capacity, product_categories, product_types, country, city, region, website) continue to be written where an answer maps onto them, so directory, matchmaking and settings keep working unchanged. Answers with no dedicated column live in `profile_answers` keyed by field id.
- New `src/lib/entity-profiles.ts`: the 18 type definitions (field id, label, input kind, options, category weight bucket) plus the legacy-type mapping — one source of truth for the wizard, the score and future matching.
- New `src/lib/profile-score.ts`: weighted scoring and missing-field list, entity-type aware.
- New server fn `saveOrgProfileAnswers` in `src/lib/orgs.functions.ts` (owner/admin gated via `user_can_edit`) that persists a partial answer patch plus recomputed score.
- `CreateOrgForm.tsx` updated for the short field set (first/last name, country, city/region, website) and redirects to the wizard.
- `src/lib/entities.functions.ts` / `Entity` type extended with `profileAnswers` and `profileScore`.
- Unrelated areas (messages, meetings, projects, admin console, directory) are untouched.
