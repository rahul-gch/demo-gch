# Fix "Upload failed: invalid input syntax for type uuid: sharabati"

## Root cause

Storage uploaders build the bucket folder from `entity.id`. For organizations loaded from the database (like Sharabati), `entity.id` is the **slug** (`"sharabati"`), not the organization UUID. The storage bucket's access policy casts the folder name to a UUID to check membership, so the upload fails with `invalid input syntax for type uuid: "sharabati"`.

Confirmed call sites using the slug where a UUID is required:

- `src/components/ReportUploader.tsx` — folder `entity.id` (line 26) and `orgId: entity.id` in security logs (lines 76, 99, 119)
- `src/components/supply-chain/ChainUploader.tsx` — folder `${entity.id}/supply-chain` (line 25)

The showroom product editor already resolves the UUID correctly (`entity.orgUuid ?? entity.id`), which is why only report/supply-chain uploads fail.

## Changes

1. **ReportUploader.tsx** — use `entity.orgUuid ?? entity.id` for the storage folder and for the `orgId` sent to `logSecurityEvent` (the `security_events.org_id` column is a UUID, so the slug would break logging too).
2. **ChainUploader.tsx** — same fix for its folder.
3. **Audit pass** — check remaining `entity.id` usages that feed UUID-typed storage paths or database columns (e.g. `BrandingPanel`, `org-images`, other `logSecurityEvent` callers) and apply the same `orgUuid ?? id` fallback where needed.
4. **Optional hardening (migration)** — add a regex guard (`foldername ~* '^[0-9a-f-]{36}$'`) to the `reports` bucket policies before the UUID cast, matching what the showroom bucket policies already do, so a bad folder name is denied cleanly instead of raising a cast error.

## Verification

- Sign in as a member of Sharabati, upload a report on the org dashboard and a supply-chain file on the supply-chain tab — both succeed and appear in the file list.
- Download via signed link and delete still work.
- Typecheck passes.
