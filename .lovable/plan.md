
# Per-Organization Workspace

Inside any organization, replace the global sidebar with an org-scoped one. Messages, meetings, and matchmaking are filtered to that org. Settings becomes an editable org profile.

## Routes (file-based)

```
src/routes/
  organizations.$id.tsx              # layout — OrgShell + <Outlet/>
  organizations.$id.index.tsx        # Dashboard (existing org page body moves here)
  organizations.$id.matchmaking.tsx  # matches involving this org
  organizations.$id.messages.tsx     # threads where this org is a participant
  organizations.$id.meetings.tsx     # meetings where this org is sender or recipient
  organizations.$id.settings.tsx     # org profile editor
```

Current `organizations.$id.tsx` is a leaf; promote it to a layout (returns `<OrgShell><Outlet/></OrgShell>`) and move its current body into `organizations.$id.index.tsx`.

## Sidebar swap

`AppShell` currently always renders `AppSidebar`. Change it to detect the org route and render `OrgSidebar` instead.

- New `src/components/OrgSidebar.tsx` — shows org name + tier at the top, then nav items: Dashboard, Matchmaking, Messages (with unread badge scoped to this org), Meetings (with pending count), Settings, and a "← Back to all organizations" link at the bottom that returns to `/organizations`.
- `AppShell` reads pathname; if it starts with `/organizations/<id>` (and isn't `/organizations` itself), render `OrgSidebar` with the id, otherwise `AppSidebar`.

## Per-org scoping

Extend `src/seed/comms.ts` with org-scoped helpers (no breaking changes to existing global pages):

- `getThreadsForOrg(orgId)` — threads where `orgId` is a participant.
- `getMeetingsForOrg(orgId)` — meetings where `orgId` is sender or recipient.
- `unreadCountForOrg(orgId)`.

Each thread/meeting record already carries an org id; we'll add a `participantOrgIds: string[]` field on threads when missing (back-fill on read) and `fromOrgId`/`orgId` on meetings.

The org Messages/Meetings pages reuse the layouts from the global routes but feed them the filtered lists and pass `viewerOrgId={id}` so composer/meeting actions are sent *from* this org.

`organizations.$id.matchmaking.tsx` reuses `getTopPairs` filtered to pairs where `from.id === id || entity.id === id`, then renders the existing matches table + `MatchProfileSheet` with `viewer` locked to this org.

## Org Settings (profile only)

`organizations.$id.settings.tsx` — editable fields backed by a small localStorage override layer (`src/seed/org-overrides.ts`), merged into the entity on read:

- Identity: display name, country, region
- Operations: lead time (days), MOQ, target delivery timeframe, on-time rate %, average delay (days)
- Materials (comma-separated chips), Certifications (chips)

Save writes the override; dashboards and matchmaking read through a `getOrgWithOverrides(id)` helper so edits flow into the existing UI. Global matchmaking weights stay on `/settings` and are unchanged.

## Files

**Create**
- `src/routes/organizations.$id.index.tsx`
- `src/routes/organizations.$id.matchmaking.tsx`
- `src/routes/organizations.$id.messages.tsx`
- `src/routes/organizations.$id.meetings.tsx`
- `src/routes/organizations.$id.settings.tsx`
- `src/components/OrgSidebar.tsx`
- `src/seed/org-overrides.ts`

**Edit**
- `src/routes/organizations.$id.tsx` — convert to layout returning `<Outlet/>`, add org tab header
- `src/components/AppShell.tsx` — choose sidebar based on pathname
- `src/seed/comms.ts` — add org-scoped selectors and `participantOrgIds`
- `src/components/MatchProfileSheet.tsx` / `MessageChannel.tsx` / `MeetingRequestDialog.tsx` — accept optional `viewerOrgId` so sends are attributed to the active org

## Notes

- Global `/messages`, `/meetings`, `/matchmaking`, `/settings` remain as admin-wide views.
- No backend changes; everything continues to live in seed + localStorage.
