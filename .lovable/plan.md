## Phase 2 — Messages + meetings on the backend

Goal: replace the browser-local demo store (`src/seed/comms.ts`, `gch.threads.v1` / `gch.meetings.v1` in localStorage) with real shared data, so a message sent by one organization actually arrives for the other, live.

The current UI stays exactly as it is — conversation list, chat pane, info sidebar, meetings pages, and the matchmaking "Send message" / "Request meeting" actions all keep their layout. Only the data underneath changes.

### What becomes real

**Conversations**
- A conversation is between two organizations. Opening a chat from matchmaking, a profile, or the messages page finds the existing thread between the two orgs or creates it.
- Messages carry the real author (name pulled from their membership record), body, timestamp, and per-participant read state.
- Unread counts in the sidebar and conversation list come from actual unread rows, not a local counter.
- Live delivery: new messages appear in an open thread without refreshing, and the conversation list re-orders by latest activity.

**Meetings**
- A meeting request records who asked, which org they asked, the proposed time, duration, and agenda.
- The receiving org sees it in their meetings page and can accept, decline, or propose a new time; the sender sees the status change.
- Past-dated pending requests fall into a "Past" state automatically for display.

**Access rules**
- Only members of one of the two participating organizations can read a conversation or its messages.
- Only members can send into it; a message's author is taken from the signed-in session, never from the form.
- Same rule for meetings: visible and answerable only by the two orgs involved.

### Seed / demo continuity

The existing demo threads are generated in code per organization. To avoid every page suddenly looking empty, a one-time import writes a small set of realistic conversations and meeting requests between imported organizations into the database, so Messages and Meetings still look populated on first load. After that, everything shown is real.

### Technical notes

- New tables: `conversations`, `conversation_participants` (org-scoped), `messages` (with `read_at` per participant via a `message_reads` table), and `meeting_requests`. Each with grants, RLS scoped through the existing `is_org_member` helper, and `updated_at` triggers.
- Access from the app goes through `createServerFn` in `src/lib/messaging.functions.ts` and `src/lib/meetings.functions.ts`, using the authenticated middleware so RLS applies as the signed-in user; reads are wired through TanStack Query with loader prefetching.
- Realtime: `conversations` and `messages` added to the realtime publication; the chat pane subscribes inside `useEffect` and tears the channel down on unmount, invalidating the relevant query keys.
- `src/seed/comms.ts` and `src/lib/use-comms.ts` are deleted once the four routes (`/messages`, `/meetings`, and the two org-scoped equivalents) plus `MeetingRequestDialog` and `MatchProfileSheet` are switched over.
- "My org" for a signed-in user comes from the existing `myOrgMemberships` server function; on the platform-wide `/messages` page the active membership is the acting org.

### Delivery

One round: tables + import, server functions, then the four routes and two dialogs switched over, verified end-to-end in the browser (send a message as one org, see it arrive; request a meeting, accept it from the other side). Phase 3 (projects + requests) follows.
