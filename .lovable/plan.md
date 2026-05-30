
## Goal
Add in-app communication so personas (Rahul, George, Maria, Admin) can send messages, request meetings, and respond to each other — visible across logins on the same browser.

## Scope (frontend-only, demo-grade)
- Persisted in `localStorage` (no backend). Keyed store survives logout/login and reloads.
- 4 participants: `rahul`, `george`, `maria`, `admin`.
- Inbox visible to the logged-in user only — they see threads where they are sender or recipient.

## New files

### 1. `src/lib/messaging.ts`
- Types:
  - `Message { id, from, to, text, ts, read }`
  - `MeetingRequest { id, from, to, title, proposedAt, durationMin, agenda, status: "pending" | "accepted" | "declined" | "rescheduled", responseNote?, rescheduledAt?, ts }`
- Store shape: `{ messages: Message[], meetings: MeetingRequest[] }` under key `gch_comms`.
- Helpers: `loadComms`, `saveComms`, `sendMessage`, `markThreadRead`, `createMeeting`, `respondMeeting`, `threadsFor(user)`, `messagesBetween(a,b)`, `meetingsFor(user)`.
- Light pub/sub (`window`-level event `gch:comms`) so the UI re-renders after any mutation in the same tab.
- Seed defaults on first load: a few sample messages and one pending meeting between Rahul↔George and Rahul↔Maria so the inbox isn't empty.

## Modified files

### 2. `src/routes/index.tsx`
- Add a `Messages` tab/section visible to all logged-in users (not just admin):
  - Header: a small "Messages" pill with unread badge next to the user/profile area.
  - Clicking opens a Messages panel below the dashboard (toggled state, no new route).
- `MessagesPanel` component:
  - Left column: thread list (one per other participant). Shows name, last message preview, timestamp, unread badge.
  - Right column: active thread.
    - Message bubbles (mine vs theirs) chronologically.
    - Composer: textarea + Send button.
    - "Request meeting" button → opens inline form (title, date/time, duration, agenda) → creates pending meeting.
    - Meeting cards inline in the thread, with action buttons for the recipient:
      - Accept, Decline (with optional note), Propose new time (date/time input → status `rescheduled` with `rescheduledAt`).
    - Sender sees response status + note.
- Admin view: same component, but admin can see/select threads with any of the 3 users; non-admin users see threads with the other 3 participants only (including admin).

### 3. Small UI affordance on existing dashboards
- On Rahul/George/Maria dashboards, add a "Message" button on relevant items (e.g., matchmaking suggestion cards) that opens the Messages panel pre-filled to that recipient. Keep this minimal — just a button that sets the active thread.

## Out of scope
- No real-time across browsers/devices, no email, no calendar export.
- No new routes, no auth changes, no Lovable Cloud / backend.
- No file attachments, no group threads.

## Result
After login, every persona has a Messages inbox where they can chat 1:1 with the other personas, send meeting requests, and accept / decline / reschedule. State persists locally so switching accounts in the same browser shows the conversation from the other side.
