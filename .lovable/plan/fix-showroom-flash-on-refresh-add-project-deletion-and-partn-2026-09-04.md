# Fix showroom flash on refresh; add project deletion and partner removal

## Why the yellow banner flashes on refresh

On your own showroom (`/organizations/sharabati/showroom`), the page decides whether to show the amber "Connect with Sharabati to order samples" banner using `!isOwner && !isConnected`. While the showroom data is still loading (right after a refresh), both values default to `false`, so for a split second the page treats you as a stranger and paints the banner, the empty "Products (0)" tab and three blank placeholder cards. As soon as the data arrives, `isOwner` becomes `true` and the banner disappears. It is purely a loading-state bug, not a permissions problem.

## Changes

### 1. Showroom loading state (no flash)
- While the showroom query is loading, do not render the connect banner, the amber "Connect Partner" button, or the "(0)" counts. Show a neutral skeleton instead (header stays, tabs show without counts, product grid shows shimmer cards).
- Only evaluate `!isOwner && !isConnected` once data has actually loaded.
- Apply the same guard to the public showroom page, product detail page and order page so none of them flash a "not connected" notice before data arrives.

### 2. Delete a project
- Add a "Delete project" action (with a confirmation dialog that requires typing the project name) available only to owners/admins of the organization that owns the project.
- Shown in two places: a "..." menu on each card in the Projects list, and a red "Danger zone" block at the bottom of the project's Permissions page.
- Deleting removes the project and everything inside it (partners, requests, documents, discussions, meetings, activity) - the database already cascades these. After deletion you land back on the projects list.

### 3. Remove a partner from a project
- On the project's Partners page, each partner card gets a "Remove" option (in a small "..." menu) with a confirmation dialog.
- Available to owners/admins of the project's owner organization, or partners who hold the "invite" permission. The owner organization itself cannot be removed.
- Removing a partner also clears their pending requests assignment (existing database rule sets it to empty) and writes an activity-timeline entry ("X removed Y from the project").
- Replace the non-functional "Contact" button on partner cards with this menu so the card stays tidy.

## Technical details

- `src/components/showroom/ShowroomWorkspace.tsx`: gate the banner and counts on `productsLoading`; add a `ShowroomSkeleton`. Same `isLoading` guard in `PublicShowroomPage.tsx`, `ProductDetailPage.tsx`, `OrderPage.tsx`.
- `src/lib/projects.functions.ts`: add `deleteProjectFn` (asserts `assertOrgRole(..., ownerOrg, "admin")`, deletes from `projects`) and `removePartnerFn` (checks caller is owner-org admin or has `invite` permission, refuses removing the owner org, deletes from `project_partners`, inserts a `project_activity` row).
- `src/lib/use-projects.ts`: add `deleteProject` and `removePartner` helpers that call these and invalidate the project queries.
- UI: `ProjectsIndex.tsx` card menu, `panels.tsx` PartnersPanel menu and a `DangerZone` on the permissions route, using the existing `AlertDialog`/`DropdownMenu` components.
- Database: existing policies already allow `projects` delete by `user_can_manage(owner_org_id)` and `project_partners` delete via the `invite` permission; one small migration widens partner deletion to also allow owner-org managers (`user_can_manage` on the project's `owner_org_id`) so an org admin can remove partners without holding the invite flag.

## Verification
- Refresh `/organizations/sharabati/showroom` as the Sharabati owner: no amber banner at any point, skeleton then products.
- As a non-connected visitor, the locked/connect state still appears once loaded.
- Create a test project, add a partner, remove the partner (card disappears, activity entry added), delete the project (redirect to list, gone from database). Non-admin members do not see the delete/remove options.
- Typecheck passes.
