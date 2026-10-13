# Credentials review, database changes and full security check

## What I found
- The Approved and Rejected lists are empty because there are no credentials in the database yet: zero items in any status (pending, approved or rejected). Nobody has added an audit, certificate or membership yet, so the screen isn't broken. It just has nothing to show.
- Admins already have read access to every organization's credentials, so items will show up once they exist.
- Possible gap (still to confirm): organization editors are allowed to update their own credentials. If nothing on the database side stops it, an editor could mark their own item "Approved".

## Steps
1. **Make the admin Credentials tab clearer**
   - Show how many items are in each list on the Pending, Approved and Rejected buttons.
   - Replace "Nothing here." with a message for each list, for example "No approved credentials yet."
   - Show an error message if a list fails to load, instead of a blank list.
   - Show who reviewed each item, when, and the review note on the Approved and Rejected lists.
2. **Test the whole flow for real**: add a certificate with a file on a test organization, approve it as admin, check it appears in Approved and in the directory filter, then reject one and check it appears in Rejected.
3. **Block self-approval**: confirm whether editors can set the status to Approved or Rejected. If they can, add a database rule that only platform admins can change status and review fields. Then add a test for it.
4. **Full security check**: run a fresh security scan and the database checker. Fix any real issues inside what's listed here. Report everything else, including the 20 known warnings about internal database functions.
5. **Two open bugs from earlier**: order addresses that are only a company name, and the missing primary contact at the top of the dashboard. I'll fix both if you agree.

## How database changes work (overview for you)
- Every change to the database structure is saved as a numbered step in the project's history and applied once to the live database. Preview and the published app use the same database, so changes are live as soon as they're applied.
- Changes only add things. Columns and tables are never deleted or renamed, so old data and the published app keep working.
- Seeding or fixing data runs separately from structure changes.
- Older changes come from the earlier setup and newer ones from the current one. Both are already applied. Nothing is waiting to run.

## Technical details
- `CredentialsQueue.tsx`: per-status counts, error state, reviewer and note details.
- Migration: a trigger on `org_credentials` that blocks changes to status, reviewed_by, reviewed_at or review_note unless `is_platform_admin(auth.uid())`. New rows can only start as self_declared.
- Vitest test for the status rule.
