# Cleanups: greetings, documents, org branding

## 1. Remove time-of-day greetings

The AI Command Center briefing text is built in `src/lib/dashboard-derive.ts` and still starts with "Good morning, ..." / "Good afternoon, ..." for both the new-org and the scored-org paragraph.

- Delete the `greetingForNow()` helper and drop the greeting + name prefix from both summary strings, so the briefing opens directly with the organization statement (e.g. "Abou Madawy's Network Health score is 62. ...").
- Remove now-unused imports/usages of the helper and the sun/moon icon anywhere it is referenced.

## 2. Documents: one real store instead of two mock ones

Today there are two unrelated "Documents" surfaces:

- Dashboard > Documents tab: `ReportUploader` + `DocumentsList`, which renders `getMockDocuments()` from `src/seed/showcase.ts` — sample rows that only exist for seeded demo orgs and show nothing for real orgs.
- Compliance page: certificate/transaction-certificate sheets with hardcoded sample attachments whose Download button shows "Sample document — download disabled in preview".

Plan:

- Make the dashboard Documents tab the single real document library for the organization: files uploaded through the existing secure storage flow, listed with name, type, size, uploader and date, with download via a signed URL and delete for org members.
- Retire `getMockDocuments` and the demo attachment lists in the compliance sheets; the compliance sheets link to the org document library instead of fake files.
- Empty state for a new org: a clear "No documents yet — upload your first certificate or report" panel, no fabricated rows.

## 3. Logo and banner upload in organization settings

`orgs` stores `logo_url` (set only at signup) and has no banner field; the settings Profile tab has no image controls. `OrgBanner` currently picks stock Unsplash photos by entity type.

- Add a "Branding" card at the top of Settings > Profile with:
  - Logo upload (square, preview, replace/remove) saved to the existing `org-logos` storage bucket and written to `orgs.logo_url`.
  - Banner images upload (up to 4, drag order, remove) saved to a new `org-banners` bucket and written to a new `orgs.banner_urls` column.
- `OrgBanner` uses the uploaded banners when present and falls back to the current stock images only when the org has uploaded none; `HeroPassport`/sidebar logo medallion uses the uploaded logo.

## Technical notes

- Migration: add `banner_urls text[]` to `public.orgs`; create a public-read `org-banners` storage bucket with insert/update/delete policies restricted to members of the owning org (path prefixed by org id). Extend `updateOrgProfile` input with `logoUrl` and `bannerUrls`.
- Uploads go through the browser Supabase client to storage, then the returned paths are saved via the existing `updateOrgProfile` server function; client-side validation for type (jpg/png/webp) and size (logo 2 MB, banner 5 MB).
- Document library: reuse the existing report upload storage path and add list/delete server functions plus signed-URL download, keeping RLS scoped to org members.
