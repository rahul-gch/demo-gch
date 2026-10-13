# Richer onboarding questions for Manufacturers, Dye Houses and Mills

## What changes for users

**Manufacturer**
- "Products manufactured": keep every current option, add Polo shirts, Shirts & blouses, Dresses, Skirts, Trousers & chinos, Sweatshirts & hoodies, Shorts (duplicates skipped).
- New "Process capabilities" (multi-select): Pattern making, Grading, Marker making (CAD), Sampling, 3D sampling (CLO / Browzwear), Automatic cutting, Bonding / seam taping / welding, Fully-fashioned / whole-garment knitting, Embroidery, Screen / DTG / DTF printing, Garment washing, Garment dyeing, Pressing & finishing, In-house quality lab. The existing "Manufacturing capabilities" stays as is.
- Production capacity: add a "Monthly production capacity" number field (pieces / month) next to the existing free-text capacity.

**Dye House** (six new multi-selects)
- Facility type (named "Facility type", not "Organisation type", so it never clashes with the organization type picked at signup)
- Printing types, Mechanical finishing, Chemical & functional finishing, Garment washing, Environmental infrastructure — with exactly the options you listed.
- Monthly capacity number field added beside the existing "Dyeing capacity".

**Mill** (five new/extended multi-selects)
- Facility type (Weaving mill, Circular-knitting mill, ... Vertical mill).
- Fabric construction: replaced option list with your detailed list; old saved answers (e.g. "Circular knit") still show as selected and stay saved.
- Fabric types: your 15 options added to the existing ones (no duplicates).
- Materials handled: a Mill-specific list with your cotton / bast-fibre options.
- In-house services: your 10 options (existing "Manufacturing capabilities" kept so old answers survive).
- Monthly capacity number field.

**Multiple locations with a plus button**
- New "Locations" question for these three types (and shown in profile settings): each row has Site name, Address, City, Country; a "+ Add location" button adds rows, a remove button deletes one.
- Existing "Factory locations" text answers stay visible as a note under the list and are not deleted.

**Onboarding flow**
- Questions appear in the existing optional sections (What you offer / capabilities / operations / credentials), 3 per page, all skippable, Back still works. The new sections also appear in the dashboard "Complete your profile" panel and Settings.

## Data safety
- No database table changes. All new answers live in the existing profile answers store with new, unique question IDs, so nothing old is renamed or overwritten.
- Old option values not in a new list are kept and still displayed as selected chips.
- Completion % reweighted per entity so the extra questions help reach 80%+ without lowering anyone's current score unfairly.

## Technical details
- `src/lib/entity-profiles.ts`: extend `Manufacturer`, `Mill`, `Dye House` field arrays; new IDs `processCapabilities`, `monthlyCapacity`, `dyeFacilityType`, `printingTypes`, `mechanicalFinishing`, `chemicalFinishing`, `garmentWashing`, `environmentalInfrastructure`, `millFacilityType`, `millMaterials`, `inHouseServices`, `locations`. Merge option lists with dedupe helper.
- New field kind `"locations"` (array of `{name,address,city,country}`); extend `ProfileAnswers` type, `ProfileFieldInput` renders a repeatable row list with Plus / Trash icons and `CountrySelect`.
- `ProfileFieldInput` multi: render saved values not in `options` as extra selected chips.
- `saveOrgProfileAnswers` zod schema in `src/lib/orgs.functions.ts`: allow arrays of location objects (bounded: max 20 rows, string length limits).
- `profile-score.ts`: a locations field counts answered when at least one row has a city or country.
- Tests: update `entity-profiles.test.ts` / `onboarding-sections.test.ts` — new fields exist for each type, legacy values preserved, locations answered rule, Supplier/legacy types unaffected.
