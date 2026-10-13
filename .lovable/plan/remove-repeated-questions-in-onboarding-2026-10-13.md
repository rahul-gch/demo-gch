# Remove repeated questions in onboarding

## What I found (checked all organization types)
Repeats exist only in the three types we extended recently:

- **Manufacturer**
  - "Production capacity" (free text) and "Monthly production capacity" (number) ask the same thing.
  - "Process capabilities" and "Manufacturing capabilities" overlap (Embroidery, Printing, Washing, Sampling, Pattern making appear in both).
- **Mill**
  - "Production capacity" and "Monthly fabric capacity" ask the same thing.
  - "In-house services" and "Manufacturing capabilities" overlap.
- **Dye House**
  - "Dyeing capacity" and "Monthly processing capacity" ask the same thing.

All other types (Farmer, Ginner, Spinner, Brand, Retailer, Logistics, Trims, Agent, Recycling, etc.) have one capacity question and no repeated lists. Locations were already fixed earlier.

## Change
1. Capacity: keep one question per type, the monthly number with its unit:
   - Manufacturer: "Monthly production capacity" (pcs / month)
   - Mill: "Monthly fabric capacity" (metres / month)
   - Dye House: "Monthly processing capacity" (kg / month)
   The old free-text box is removed.
2. Capabilities: one list per type.
   - Manufacturer: keep "Process capabilities", add the missing old options (Cut & sew, Knitting, Quality control) so nothing is lost.
   - Mill: keep "In-house services", add the missing old "Manufacturing capabilities" options.
3. Old answers are kept: if someone already typed capacity as text, it shows as a small "Previously entered: ..." note under the number field. Old selected capabilities appear pre-selected in the remaining list. Nothing saved is deleted.
4. Applies to onboarding, the dashboard "Complete your profile" panel and Settings. Completeness counts each topic once.

## Technical details
- `src/lib/entity-profiles.ts`: drop `fCapacity` from Manufacturer and Mill, drop `dyeingCapacity` from Dye House; drop `manufacturingCapabilities` from Manufacturer and Mill; merge their options into `processCapabilities` / `inHouseServices` via `mergeOptions`.
- Extend `withLegacyLocations` (rename to `withLegacyAnswers`) to also merge legacy `manufacturingCapabilities` values into the kept list when the kept list is empty; legacy keys stay in saved answers.
- `monthlyCapacity` field: add a `legacyFrom` hint (`capacity` / `dyeingCapacity`) that `ProfileFieldInput` shows as a muted note.
- The org `capacity` column stays filled: the monthly number is written as "N unit" to `capacity` on save, so directory and dashboard keep working.
- Tests: each of the three types has exactly one `capacity`-bucket capacity field and one capabilities list; legacy values are carried over.
