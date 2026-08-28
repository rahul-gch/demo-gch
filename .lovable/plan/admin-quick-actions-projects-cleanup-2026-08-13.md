# Admin quick actions + projects cleanup

## 1. Admin dashboard quick actions

Today the admin quick-action strip shows 7 tiles, three of which do nothing at all
("Create Project", "Invite User", "Upload Dataset" are plain buttons with no handler)
and two of which point at pages that don't match the label.

New set — every tile links to a real, working destination:

| Tile                      | Goes to                            |
| ------------------------- | ---------------------------------- |
| Add organization          | Admin page, "Add organization" tab |
| Onboarding links (invite) | Admin page, "Onboarding links" tab |
| Organizations directory   | Organizations list                 |
| Matchmaking               | Matchmaking page                   |
| Messages                  | Messages page                      |
| Community feed            | Feed page                          |

Removed: "Create Project" (projects are created inside an organization workspace,
not from admin), "Approve Partnership" (the approve action was already removed from
admin earlier), "Upload Dataset" (no dataset import feature exists).

The admin tabs get deep-linkable via a `?tab=` search param so the two admin tiles
open the right tab directly.

## 2. Remove projects dummy data

The `projects` tables hold 675 bulk-generated demo projects (all inserted in one batch
on 31 July, names like "Veja — Closed-Loop Water Initiative") plus their generated
partners, requests, documents, discussions, meetings and activity — roughly 13,000 rows
in total. None of it is real user data; nothing has been created since.

- A migration deletes every row from `project_activity`, `project_documents`,
  `project_discussions`, `project_meetings`, `project_requests`, `project_partners`
  and `projects`.
- After this, every organization's Projects tab starts empty.

## 3. Keep projects working end to end

With the seed gone, the empty state matters, so:

- Projects list gets a proper empty state ("No projects yet" + Create project button)
  instead of only the "no match for your search" card.
- New projects created without a cover image no longer inherit a stock Unsplash photo;
  they render a neutral branded gradient header.
- Verify the full flow after the purge: create project → invite partner → set
  permissions → create request → comment / change status → upload document →
  discussion + reply → schedule meeting → action items, each writing to and reading
  back from the database.

## Technical notes

- `src/lib/ops-derive.ts`: replace the `QUICK_ACTIONS` array; every entry has a `to`.
- `src/components/ops/QuickActions.tsx`: drop the non-link `<button>` branch and the
  now-unused icons; support `search` params on links.
- `src/routes/_authenticated.admin.organizations.tsx`: read/write a `tab` search param.
- `src/components/projects/ProjectsIndex.tsx`: empty state; card header falls back to a
  gradient when `p.image` is empty.
- Migration: `DELETE FROM` the seven project tables (children first).
