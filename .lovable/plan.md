## Consolidate Sharabati into one enriched org

Edit only `src/seed/entities.ts`:

1. **Delete duplicates**
   - Remove `gch-011` "Alroubaia Textile Co. Fourtex / Sharabati Denim" (lines 578–630).
   - Remove `gch-087` "Al Roubaia FOURTEX Textiles Co. S.A.E / Sharabati denim" (lines 4921–4979).
   - No other code references these IDs (verified via ripgrep), so no follow-up wiring needed.

2. **Enrich `gch-135` as the single Sharabati record** using data from https://sharabati-denim.com:
   - `name`: `"Sharabati"` (per your instruction).
   - `website`: `https://sharabati-denim.com`.
   - HQ: Sadat City, Egypt (3rd Industrial Extension Zone); mark Türkiye & Syria as production/origin regions.
   - Coordinates: Sadat City (30.3833, 30.5167) instead of the placeholder.
   - Description: family-run weaver founded Aleppo 1978, HQ Egypt, factories Türkiye, sales offices in Egypt/Türkiye/Italy/Germany/Sweden/Spain/Tunisia/Morocco/USA, warehouses Tunisia + Morocco, denim + flat + luxury + artisan selvedge, sustainability focus.
   - Comments: capacity ~140M meters/year, ~5,000 employees.
   - `materials`: Denim, Flat Fabric, Luxury Denim, Artisan Selvedge.
   - `capabilities`: Weaving, Denim Finishing, Sustainable Denim, Selvedge, Private-label Collections.
   - `capacity`: `~140,000,000 meters/year`.
   - Contacts: Eng. Ghayth Miro (Managing Director, Ghayth.m@sharabati-denim.com, +20 10 12241009) + Alessandro Moretti Ciacci (Export Sales & Marketing Director).
   - Scores: bump `confidenceScore` 45→78, `profileCompleteness` 50→85, `matchmakingReadiness` 30→80, `kpiReadiness` 60→90, `traceabilityReadiness` 0→60, `riskLevel` High→Low, `verificationStatus` Incomplete→Verified, clear stale `missingFields` to just `certifications`, update `recommendedNextAction`.

3. **Verify**: run typecheck, then open `/organizations` and `/organizations/gch-135` to confirm Sharabati appears once with the enriched profile and the two old entries are gone.

No schema, backend, or UI code changes — seed-only edit.
