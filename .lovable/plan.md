# Messages + Notifications: real data only

Two goals: strip every invented value out of the Messages experience, and add a working notification bell that reflects real activity.

## 1. Remove dummy data from Messages

- **Fake online/offline presence** — avatars and headers currently show a green "Online" dot generated from a hash of the organization ID. There is no presence tracking, so this is invented. Remove the dot and the "Online / Offline" text everywhere in the messaging UI.
- **Invented "Shared with you" counts** — the organization info sidebar falls back to hardcoded 3 projects / 12 documents / 2 requests when no counts are passed (which is always). Replace with real counts fetched for the pair of organizations; show zeros / "None yet" when there is nothing.
- **Dead menu items** — "Shared documents", "Mute conversation", "Mark as unread", "Archive" in the chat header menu, and "Request documents" in the sidebar, do nothing. Remove the ones with no backing feature; keep only actions that work (View profile, Schedule meeting, Create shared project).
- **Dead message hover actions** — Reply, React and More on each bubble do nothing. Keep Copy, remove the rest.
- Keep the existing layout, navigation and page flow unchanged.

## 2. Notification centre

Add a bell icon in the app header (next to the user menu) with an unread count badge and a dropdown panel. Everything in it comes from the database — no placeholders. When there is nothing, the panel says so.

Notification sources, scoped to the organization the user is currently acting as:

- New messages in conversations since that org last read them
- Pending meeting requests received
- Pending project requests assigned to the org
- Pending partner invitations to projects

Each row shows the counterpart organization, a short summary, and relative time; clicking it navigates to the relevant page (thread, meetings, project request). A "Mark all as read" action clears message-based items by updating last-read timestamps. The panel refreshes live off the existing realtime message subscription and on a short poll for meetings/requests.

## Technical notes

- New `src/lib/notifications.functions.ts` with an authenticated `listNotifications` server function that aggregates from `conversation_participants` / `messages`, `meeting_requests`, `project_requests` and `project_partners`, returning a plain DTO list sorted by time. No new tables, no schema change.
- New `useNotifications` hook in `src/lib/use-comms.ts` (or a sibling `use-notifications.ts`) keyed by acting org, invalidated by the existing realtime channel.
- New `src/components/NotificationBell.tsx` rendered in `AppShell` and `OrgShell` headers.
- Presence removal touches `src/components/messages/shared.tsx` (`isOnline`, `StatusText`), `ConversationList.tsx`, `ChatHeader.tsx`.
- Sidebar counts: extend the notifications/server-function file with a small `orgSharedCounts` server fn used by `OrgInfoSidebar`.
