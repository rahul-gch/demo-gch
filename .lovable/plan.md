## Goal
Restructure each organization's sidebar to match the requested 11-item navigation, and build the **Feed (Community)** page as the first section. All other new sections get placeholder routes so navigation works end-to-end; we'll flesh them out one-by-one in follow-ups.

## Sidebar changes (`src/components/OrgSidebar.tsx`)

Replace current items with, in order:

1. Home / Feed → `/organizations/$id/feed` (new)
2. Dashboard → `/organizations/$id` (existing)
3. Projects → `/organizations/$id/projects` (new, placeholder)
4. Supply Chain Mapping → `/organizations/$id/supply-chain` (new, placeholder)
5. Matchmaking & Partnerships → `/organizations/$id/matchmaking` (existing, renamed label)
6. Research Database → `/organizations/$id/research` (existing, renamed label)
7. Messages & Meetings → `/organizations/$id/messages` (existing entry, merged label; keep meetings route reachable via a tab inside — no route removal)
8. Compliance → `/organizations/$id/compliance` (new, placeholder)
9. Circularity & DPP → `/organizations/$id/circularity` (new, placeholder)
10. Requests → `/organizations/$id/requests` (new, placeholder)
11. Settings → `/organizations/$id/settings` (existing)

Keep existing icons where they map; use Lucide `Rss`, `FolderKanban`, `Network`, `ShieldCheck`, `Recycle`, `Inbox` for new items. Merge Messages+Meetings badges (unread + pending) on the combined item.

Note: the existing `/organizations/$id/meetings` route file stays intact so nothing internal breaks; it just isn't linked directly in the sidebar anymore. (User said don't change anything internally.)

## Feed page (new, full build)

New route: `src/routes/organizations.$id.feed.tsx` rendered inside `OrgShell`.

New component: `src/components/feed/FeedWorkspace.tsx` with:

- **Composer card** at top: tabs for Post / Project / Event, textarea, attachment chips (Photo, Video, Document), Post button.
- **Filter bar**: All · Updates · Regulations · Investments · Partnerships · Events · AI News.
- **Post types rendered as cards** (icon + colored tag per type):
  - Company update, New regulation, Investment opportunity, Partnership announcement, Event (with RSVP button + attendee count), AI-generated news (with sparkle badge), Photo, Video, Document.
- **Interactions per card**: Like (toggle + count), Comment (expands inline thread), Share (copy link toast).
- **Quick actions rail** (right column on desktop): Create Project · Create Event · Upload Media buttons that open the composer in the matching mode.

State: local `useState` + `localStorage` persistence keyed by org id (matches existing seed/comms pattern). No backend calls.

New seed file `src/seed/feed.ts` with ~12 mixed sample posts per org (deterministic by org id) so the feed looks alive for every entity type.

## Placeholder routes (new files)

Each renders inside `OrgShell` with a titled empty-state card ("Coming soon — <section name>") so the sidebar link resolves and the layout stays consistent:

- `src/routes/organizations.$id.projects.tsx`
- `src/routes/organizations.$id.supply-chain.tsx`
- `src/routes/organizations.$id.compliance.tsx`
- `src/routes/organizations.$id.circularity.tsx`
- `src/routes/organizations.$id.requests.tsx`

Each sets a route-specific `head()` with title + description.

## Out of scope (do later, per user)

Building out Projects, Supply Chain Mapping, Compliance, Circularity & DPP, Requests, and any Messages+Meetings unification. No changes to existing dashboard, research, matchmaking, messages, meetings, or settings internals.

## Technical notes

- All new routes follow existing dot-file naming (`organizations.$id.<section>.tsx`) and use `createFileRoute` matching the generated ID.
- Feed uses `<Link>` from `@tanstack/react-router` for any internal nav; no `<a href>`.
- Persist feed state via a small helper (`src/lib/use-feed.ts`) mirroring `use-comms.ts` so badges/interactions survive reloads.
- Sidebar badge for "Messages & Meetings" = `unreadCountForOrg(id) + pendingMeetingCountForOrg(id)`.
