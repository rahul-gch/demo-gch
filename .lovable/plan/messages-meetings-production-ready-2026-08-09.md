# Messages + Meetings: production-ready

## What I verified

- Your meeting request exists in the database: "test org" → "rahul gmbh", still pending, scheduled 11 Aug. So it was saved correctly.
- The Meetings page has **no Sent/Received split at all** — it only buckets by Pending / Confirmed / Past, with no direction filter, no withdraw action and no details view. A request you sent shows up in "Pending" with no controls, which is why it feels missing from an outbound box.
- Both accounts involved are separate users, and the page always acts as your _first_ organization, so if you are signed in as an account with more than one organization the request can also land under the other one.
- Live updates: only `messages` and `conversations` are published for realtime. `meeting_requests` is not, so meeting activity never updates without a refresh. Notifications only re-poll once a minute for meetings/requests.

## 1. Meetings section rebuild

- **Direction tabs**: Inbound (received) and Outbound (sent), each with status sub-filters (Pending, Confirmed, Declined/Withdrawn, Past) and counts. Your sent request will appear under Outbound → Pending.
- **Withdraw**: outbound pending requests get a "Withdraw" action with confirmation; withdrawn requests get their own "Withdrawn" label instead of being lumped in with "Declined".
- **Details**: clicking a card opens a details dialog — counterpart organization, entity type/country, date, time, duration, full agenda, who requested it, when it was sent, current status, and actions in context (Confirm / Decline for inbound, Withdraw for outbound, Message organization, View profile).
- **Reschedule-free by design**: no fake actions; only actions that write to the database.
- The organization switcher stays, plus a hint line showing which organization you are acting as, so multi-org accounts see why a request may be under another organization.

## 2. Messages in realtime

- Keep the existing layout. Make the realtime subscription reliable across pages: conversation list, open thread, and unread badges all update instantly on new messages (already partly there; will be moved to a single shared subscription so it also works when Messages is not open).
- Sending shows the message immediately (optimistic) and reconciles with the server row.
- Read state updates live so the unread badge clears on both sides.

## 3. Notifications end to end

- Add meeting activity to realtime so new/answered/withdrawn meeting requests push a notification instantly instead of waiting for the 60s poll.
- Bell badge updates live; a toast appears for a new incoming message or meeting request when you are on another page.
- Each notification navigates to the right place (thread, Meetings → correct tab, project request).

## Technical notes

- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_requests;` and set `REPLICA IDENTITY FULL` on it. No schema change, no new tables. Existing RLS on `meeting_requests` (member of either org) already scopes what realtime can deliver.
- `src/lib/comms-types.ts`: add `"Withdrawn"` to `MeetingStatus`, add `requesterOrgId` / `recipientOrgId` and `direction` to `MeetingRequest`; `meetings.server.ts` maps `cancelled` → `Withdrawn`.
- `src/lib/meetings.functions.ts`: allow `cancelled` only when the caller's org is the requester and the row is still pending.
- `src/lib/use-comms.ts`: `useMeetings` subscribes to `meeting_requests` changes; add `useWithdrawMeeting`; extract a shared realtime hook mounted once in `AppShell` / `OrgShell` so message and meeting events invalidate caches app-wide.
- New `src/components/meetings/MeetingDetailsDialog.tsx`; `MeetingCard.tsx` gains direction-aware actions; `bucketMeetings` replaced by a direction+status grouping helper used by `_authenticated.meetings.tsx` and `_authenticated.organizations.$id.meetings.tsx`.
- `src/lib/use-notifications.ts`: subscribe to `meeting_requests` in addition to `messages`; toast on new inbound items.
