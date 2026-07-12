## Goal
Make "Send message" and "Request meeting" prominent and always visible on matchmaking, and surface org details + match reasons in a popup opened from the match row.

## Changes

### 1. `src/components/MatchmakingPanel.tsx` (list cards on org matchmaking + showcase)
- Restructure each card so the top row shows: **company name (left)** and two action buttons **Send message** + **Request meeting** (right, primary + outline). Score/progress moves under the name.
- Keep the whole row clickable to open the details popup, but stop propagation on the two buttons.
- Add local state `messageOpen` and reuse `MatchProfileSheet` (which already contains message textarea + meeting dialog); when "Send message" is clicked, open the sheet with focus on the textarea; when "Request meeting" is clicked, open the sheet and immediately open the existing `MeetingRequestDialog`.

### 2. `src/routes/organizations.$id.matchmaking.tsx` (table view)
- Replace the single "View" button cell with a compact action group: **Send message** and **Request meeting** buttons (always visible, `e.stopPropagation()`), plus keep row-click to open details.
- Reorder columns so Organization name is followed immediately by the action buttons on wider screens (buttons cell right-aligned, sticky-feel).

### 3. `src/components/MatchProfileSheet.tsx` (the popup with details)
- Move the action buttons **Send message** and **Request meeting** to the **top of the sheet**, directly under the company name/badges — so they're visible without scrolling.
- Keep the existing "Why this is a match" section (reasons + breakdown bars) — this is the "why matched" content the user wants shown in the popup. Ensure it renders directly below the actions.
- Keep Operations, Materials, Certifications sections below.
- Remove the duplicate action buttons at the bottom (or keep only the "Open full profile" link there).
- Accept an optional `initialAction?: "message" | "meeting"` prop: if `"meeting"`, auto-open `MeetingRequestDialog` on mount; if `"message"`, autofocus the message textarea.

## Technical notes
- No changes to `matchmaking.ts` scoring — reasons + breakdown already available.
- All work is presentational; no backend or seed changes.
- Preserve existing `appendMessage` + `MeetingRequestDialog` flows.
