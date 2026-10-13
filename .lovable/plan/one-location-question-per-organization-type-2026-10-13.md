# One location question per organization type

## What I found (checked all organization types)
- **Manufacturer** is the only type that asks about locations twice:
  - "Factory locations": the old single text box
  - "Production locations": the new list with "+ Add location"
  Both ask the same thing (where you produce), so this is a real duplicate.
- **Mill** and **Dye House** have only the new "Production locations" list. No duplicate.
- **Farmer** (Farm location), **Logistics** (Warehouse locations) and **Clothing Banks** (Collection locations) each have one location question that asks about something different. No duplicate.
- Product questions are not duplicated. "Products manufactured" (what you make) and "Production locations" (where you make it) are separate questions.

## Change
1. Remove the old "Factory locations" text box from the Manufacturer questions in onboarding and in the "Complete your profile" panel.
2. Keep only "Production locations" (Site name, Address, City, Country, + Add location).
3. Keep existing answers: if a manufacturer already typed text in the old box and has no locations yet, show that text as the first location's address so they can tidy it up. Nothing saved is deleted.
4. Profile completeness counts locations only once.

## Technical details
- `src/lib/entity-profiles.ts`: drop the `factoryLocations` field from the Manufacturer profile (the `fLocations` field stays).
- When the form loads (in onboarding and in the completion panel), if `locations` is empty and the old `factoryLocations` text exists, fill in `[{ address: factoryLocations }]` as the starting value. The old key stays in the saved answers.
- Update the entity-profiles tests: Manufacturer has exactly one field of kind `locations` and no `factoryLocations` field.
