# Messages + Meetings: Enterprise UI Elevation

Scope: Visual + UX polish only. Keep existing routes, data, and page structure (list ↔ detail). No new backend, no nav changes.

Applies to:
- `src/routes/messages.tsx` (global)
- `src/routes/organizations.$id.messages.tsx` (per-org)
- `src/routes/meetings.tsx` + `src/routes/organizations.$id.meetings.tsx` (parallel polish pass)

## 1. Shared primitives (new)
Create small presentational components under `src/components/messages/`:
- `OrgAvatar.tsx` — initials/logo circle with verification dot and online/offline indicator.
- `ConversationCard.tsx` — org name, type · country, last message preview, timestamp, unread pill, verified check, online dot, hover elevation, selected state.
- `ChatHeader.tsx` — avatar + name + type/country + verified + status; right-side action buttons: View Profile, Schedule Meeting, Shared Documents, More (dropdown).
- `MessageBubble.tsx` — refined bubbles, sender name + small avatar for incoming, right-aligned for outgoing, hover row actions (Reply, Copy, React, More) via floating toolbar.
- `DateSeparator.tsx` — Today / Yesterday / formatted date dividers computed from message timestamps.
- `MessageComposer.tsx` — rounded textarea, Attach + Emoji + Send buttons, "Enter to send" hint, sticky bottom.
- `OrgInfoSidebar.tsx` — collapsible right panel: org summary, quick actions (View Profile, Schedule Meeting, Request Documents, Create Shared Project), shared counts (projects, documents, pending requests). Toggle stored in component state.

All components use existing shadcn primitives + tokens from `src/styles.css`. No hardcoded colors.

## 2. Messages page layout
Update both `messages.tsx` routes to a 3-pane grid:
```text
[ Conversation list 320px ] [ Chat area 1fr ] [ Info sidebar 320px, collapsible ]
```
- Increase page padding to 24–32px; card radius 12–16px; soft shadow.
- Search bar: rounded, leading search icon, subtle border.
- Selected conversation: soft `bg-muted/60` + left accent border.
- Empty state: elevated card with icon + copy.
- Scroll areas use `ScrollArea` component with styled thumb.

Wiring:
- Group messages by day → insert `DateSeparator` between groups.
- Compute `unread`, `online` (deterministic mock from entity id), `verified` from existing entity data (`entity.verificationStatus`).
- Info sidebar pulls counts from existing `projects`, `documents`, `requests` seed helpers already used elsewhere; if a helper is missing, derive from `getEntity` + project seed.
- Hover message actions: absolutely positioned toolbar; buttons are non-functional placeholders except Copy (writes body to clipboard).

## 3. Meetings parallel pass
Apply the same visual language (card radius, spacing, header treatment, right info sidebar with org summary + quick actions) to `meetings.tsx` and `organizations.$id.meetings.tsx`. No schema/logic changes — just:
- Header row with org avatar + type/country + verified.
- Cleaner list rows with status pill, time, attendees.
- Right-side collapsible org info panel reusing `OrgInfoSidebar`.

## 4. Interaction polish
- Hover elevations via `transition-shadow` + `hover:shadow-md`.
- Smooth open/close of right sidebar (`data-[state]` + transitions).
- Keep composer sticky; textarea auto-grows up to a max height.
- Cmd/Ctrl+Enter and Enter (no shift) both send.

## 5. Out of scope
- No route/nav changes.
- No changes to `src/seed/comms.ts` data shape (only read helpers may be added if needed).
- No new persistence, no backend, no auth.

## Technical notes
- All new components typed with existing `Entity` and `Message` types from `src/seed/types.ts` / `src/seed/comms.ts`.
- Use semantic tokens (`bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `primary`) — no `bg-slate-*` in new components; existing slate usages replaced in the touched files.
- Verification uses existing `VerificationBadge` from `src/components/StatusBadge.tsx`.
- Online/offline is a deterministic pseudo-status derived from `entity.id` hash to avoid flicker.
