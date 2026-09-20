# Why you see the wrong messages on another organization's page

## Diagnosis (confirmed against the live data)

You were on **Glasstextile - Private Free Zone → Messages & Meetings**, but the inbox shown (Sharabati, Allcost, xyz, test org) is the inbox of **rahul gmbh** — your own organization.

What actually happens:

1. Every organization page asks "which organization am I acting as?" and answers it from **your own memberships**, not from the organization in the address bar.
2. Your account is a member of `rahul gmbh` and `test org2`. You are not a member of Glasstextile — you reach it as a platform admin.
3. Because Glasstextile is not in your membership list, the page silently **falls back to your first membership** (`rahul gmbh`) and loads that inbox, while the page title still says "Conversations from Glasstextile - Private Free Zone".

Supporting facts:

- Glasstextile has **zero** conversations in the database, so nothing on that screen could legitimately be its own.
- The four conversations displayed are exactly the four conversations attached to `rahul gmbh`.
- The server side is not leaking anything: it only returns an inbox to an actual member of that organization. This is purely the page choosing the wrong organization and mislabelling it.

The same fallback affects other organization-scoped surfaces for an admin: meetings, the unread/pending badges in the sidebar, the notification bell, and real-time toasts.

## What to fix

Make organization pages always speak for the organization in the address bar, never a silent substitute.

1. When the viewed organization is not one of your memberships, stop falling back to another organization. The page uses the viewed organization only.
2. Allow platform admins to read that organization's real inbox and meetings (read-only), so an admin viewing Glasstextile sees Glasstextile's conversations — which in this case is an empty inbox.
3. Show a clear "Viewing as platform admin" note on those pages, and disable sending messages / creating meeting requests on behalf of an organization you do not belong to.
4. Sidebar badges, the notification bell and live toasts follow the same rule, so counts on an organization page never come from your own organization.

## Technical notes

- `useActingOrgId(preferred)` in `src/lib/use-comms.ts` returns `ids[0]` whenever `preferred` is not in the caller's memberships. Add a strict variant used by all `/organizations/$id/*` surfaces that returns the requested org id (or null) and reports whether the user is a member.
- `listConversations`, `listMessages`, `listMeetings`, `markConversationRead` and the notification queries gate on `is_org_member`. Extend the read paths to `is_org_member(...) OR is_platform_admin(...)`; keep write paths (`sendMessage`, `createMeetingRequest`, `markConversationRead`) member-only.
- Call sites to update: `_authenticated.organizations.$id.messages.tsx`, `_authenticated.organizations.$id.meetings.tsx`, `OrgShell.tsx`, `OrgSidebar.tsx`, `NotificationBell.tsx`, `MeetingRequestDialog.tsx`, `MatchProfileSheet.tsx`.
- The global `/messages` and `/meetings` pages keep the existing acting-organization switcher behaviour.
