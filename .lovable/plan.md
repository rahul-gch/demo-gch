## Plan

### 1. Add TextileGenesis organization
Add a new curated org entry (like NIKE, HM) as a Sustainability Partner / Traceability Platform:
- Create `src/seed/textilegenesis.ts` with full profile: name "TextileGenesis", HQ Hong Kong, entity type "Sustainability Partner", description covering blockchain-based fiber-to-retail traceability, key partners (M&S, Mango, Lenzing, Bestseller, Zegna, Lululemon, Gap), specialization "Digital traceability & DPP for fashion supply chains", capabilities, certifications, contacts, 5-star rating, verified status.
- Import into `src/seed/all-entities.ts` alongside NIKE/HM/MANDS/PRIMARK.

### 2. Add "Specialization" field to organizations
- Extend `Entity` type in `src/seed/types.ts` with `specializations?: string[]` (e.g. "Sportswear", "Denim", "Kidswear", "Traceability platform").
- Add `specializations text[]` column via migration on `orgs` table.
- Include in `src/lib/orgs.functions.ts` create/update payload.
- Add a chip-based multi-input in `CreateOrgForm.tsx` (suggestions per entity type: brands → Sportswear/Womenswear/Menswear/Kidswear/Luxury/Denim/etc.; manufacturers → Knitwear/Denim/Activewear/Outerwear).
- Seed specializations on Sharabati (Denim), NIKE (Sportswear/Footwear), HM (Fast fashion), M&S, Primark, TextileGenesis (Traceability).

### 3. Editable operational details on dashboard
Add an inline-editable "Operations" card on the org dashboard overview:
- New component `src/components/dashboard/OperationsCard.tsx` showing Lead time (days), MOQ, Capacity, On-time rate, Avg delay, Delivery timeframe, Materials, Specializations.
- View mode: read-only pills/values. Edit mode (pencil button, gated to org members with edit rights via existing `user_can_edit`): inline form with Save/Cancel.
- Persistence:
  - For real DB-backed orgs (UUID matches `orgs` table): call a new `updateOrgOperations` server function in `src/lib/orgs.functions.ts` using `requireSupabaseAuth` + `user_can_edit` check.
  - For seeded demo orgs (gch-*): fall back to existing `setOverride` in `src/seed/org-overrides.ts` (already merges via `applyOverride` in `getEntity`) — extend `OrgOverride` with `specializations` and `capabilities`.
- Insert card into `_authenticated.organizations.$id.index.tsx` overview, above Performance section.

### 4. Verification
- Typecheck.
- Confirm TextileGenesis appears in organizations index and its dashboard renders.
- Confirm inline edit persists across reload for a seed org (localStorage) and a DB org (Supabase).

### Technical notes
- Migration: `ALTER TABLE public.orgs ADD COLUMN specializations text[] NOT NULL DEFAULT '{}'`.
- No changes to existing NHRI/Health scoring logic.
- No changes to routing.
