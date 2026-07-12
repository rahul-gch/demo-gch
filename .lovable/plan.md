## Goal
Replace the "Coming soon" compliance page with a real compliance workspace showing social audits, product certifications, transaction certificates (TCs), expiry tracking, and per-item document uploads.

## Page layout (`src/routes/organizations.$id.compliance.tsx`)

Build one page split into 4 stacked sections plus a KPI strip at the top.

### 1. KPI strip
Four small cards derived from `entity.certificationDetails` + mock data:
- Valid certificates
- Expiring in 90 days (amber)
- Expired (red)
- Pending audits

### 2. Social Audits
Table of social/facility audits (SMETA, SLCP, BSCI, Higg FSLM, WRAP). Columns:
- Standard · Auditor · Scope (facility) · Audit date · Next due · Status badge (Passed / Minor NC / Major NC / Expired) · Actions (View / Upload evidence)

Seeded from `getMockSocialAudits(entity)` — 3–5 rows derived deterministically from entity id, reusing existing `seed()` pattern in `showcase.ts`.

### 3. Product Certifications
Table of product/material certifications (GOTS, OCS, GRS, RCS, OEKO-TEX, Cradle to Cradle, Bluesign). Rebuilt from `entity.certificationDetails` which already has `name / lastVerified / expiryDate / status`. Columns:
- Certification · Category · Issued · Expiry (with "in X days" / "expired" chip) · Status · Actions (View / Replace)

Row highlighting: red border if expired, amber if <90 days.

### 4. Transaction Certificates (TCs)
Table of TCs tied to shipments (GOTS TC, GRS TC, RCS TC). Columns:
- TC number · Standard · Issued by · Issue date · Products · Buyer · Status · Actions

Seeded from `getMockTransactionCerts(entity)` — 4–6 rows.

### 5. Document uploads
Reuse existing `ReportUploader` (already writes to the private `reports` bucket under `<entity.id>/`) but drop it into a "Compliance documents" card at the bottom so the user can upload audit reports, TCs, MSDS, etc. from the same page. All action buttons in the tables above ("Upload evidence", "Replace") scroll to this uploader.

## New file: `src/seed/compliance.ts`
- `SocialAudit`, `TransactionCert` types
- `getMockSocialAudits(entity)` and `getMockTransactionCerts(entity)` using the deterministic seed pattern from `src/seed/showcase.ts`
- Small helper `daysUntil(dateStr)` and `expiryTone(dateStr)` returning `"ok" | "soon" | "expired"` for shared row styling

## New file: `src/components/compliance/CompliancePage.tsx`
Renders the KPI strip + 3 tables + uploader. Pure presentational; takes `entity` prop. Route file becomes a thin wrapper that loads the entity and renders `<CompliancePage entity={entity} />`.

## Route file changes (`src/routes/organizations.$id.compliance.tsx`)
- Drop `ComingSoon`.
- Update `head()` description to "Social audits, product certifications, and transaction certificates."
- Render `<CompliancePage entity={entity} />`.

## Out of scope
- No backend schema changes; uploads keep using the existing `reports` storage bucket.
- No changes to matchmaking, feed, or other pages.
- No new lucide icons beyond what's already used elsewhere.
