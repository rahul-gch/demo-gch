# Professional signup, business verification, and onboarding phases 3–4

## 1. Signup page redesign (more professional)
- Split-screen layout using the full screen: left brand panel (logo, short value statement, three trust points with simple line icons, no emojis), right the registration form.
- Form grouped into clear numbered sections: 1 Organization, 2 Your login, 3 Verification.
- Consistent field heights, labels, helper text; primary button in the brand accent (warm amber from Fashion Connect Hub) instead of grey.
- Footer links tidied: "Already registered? Sign in" and invite note on one muted line.
- Stacks to one column on mobile; brand panel collapses to a slim header.

## 2. Proof of business registration (new)
- "Verification" section with a drag-and-drop upload (PDF, JPG, PNG, max 10 MB) for a business registration document.
- Checkbox below it: "I'll upload this later". One of the two is required to continue.
- The file is stored privately and only visible to the organization's owners/admins and platform admins.
- Organization gets a verification status: Not submitted, Pending review, Verified, Rejected.
- Platform admins see pending documents in Admin → Organizations and can approve or reject.
- Orgs that chose "later" get a reminder card on the dashboard.

## 3. Phase 3 — Short entity-specific onboarding
- 2–3 essential questions per organization type (e.g. Brand: sourcing focus, sourcing countries, annual volume; Fabric mill: fabric categories, monthly capacity, export markets; Spinner: yarn types, capacity, fibre inputs; Garment factory: product categories, capacity, MOQ).
- Progress indicator, "Continue to dashboard", and "Complete later" on every step. No emojis anywhere.

## 4. Phase 4 — Progressive profile and credentials in the workspace
- Dashboard readiness checklist: business verification, facility audits, certificates, memberships, with completion percentage.
- New Compliance section in the organization profile with three tabs:
  - Facility audits (SMETA, BSCI, WRAP, SLCP, Higg FEM/FSLM): facility ID, score/grade, expiry.
  - Certificates (GOTS, GRS, RCS, OEKO-TEX, BCI, Cradle to Cradle): number, scope, expiry.
  - Memberships (ZDHC, Cascale, Textile Exchange): member ID, since.
- Optional document upload per item; items marked Self-declared until verified by admin.
- Existing certification tags are kept and shown as self-declared entries; nothing is deleted.

## Technical details
- Storage: new private bucket `org-verification`; RLS on storage.objects for org managers + platform admins.
- New table `org_verification` (org_id, status, document_path, submitted_by, reviewed_by, reviewed_at, note) and `org_credentials` (org_id, kind audit|certificate|membership, standard, reference, scope, score, issued_at, expires_at, document_path, status). Grants + RLS: members read, managers write, admins review.
- Signup: file held client-side until email confirmation; uploaded on first sign-in alongside the pending org creation in `onboarding.index.tsx` (stored "later" choice in `pending_org` metadata).
- Files: `src/routes/signup.tsx`, `src/components/auth/EmailAuthForm.tsx`, new `src/components/verification/*`, `src/routes/onboarding.org.$id.tsx`, `src/lib/entity-profiles.ts` (primary fields per type), new `src/lib/credentials.functions.ts`, `src/lib/verification.functions.ts`, dashboard checklist component, admin organizations page, `src/styles.css` (amber accent tokens).
- Tests for: upload-or-later required rule, 10 MB limit, only admins can change verification status.
