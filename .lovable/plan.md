# Messages alignment fix

## Problem
At ~1189px viewport with the app sidebar mounted, the 3-column messages layout (`320px + 1fr + 320px`) plus an inner chat header with 4 action buttons overflows the container. The chat pane and info sidebar get visually clipped and the middle column can't shrink because of `min-w-0` gaps and the header's non-shrinking action row.

## Fix (visual/layout only, no logic changes)

1. **Responsive 3-column breakpoint** — in `src/routes/messages.tsx` and `src/routes/organizations.$id.messages.tsx`:
   - Show the info sidebar only at `xl:` (≥1280px). Below that, keep 2-column `md:grid-cols-[300px_1fr]` and hide the info panel.
   - Default `infoOpen` state to `false`; toggle button still opens an overlay drawer on smaller widths.
   - Narrow the conversation list to `300px` and the info sidebar to `300px` to leave more room for chat.
   - Add `min-w-0` on every grid child so the middle column actually shrinks.

2. **Chat header compression** — in `src/components/messages/ChatHeader.tsx`:
   - Move "View Profile / Schedule / Documents" behind the More dropdown at `<lg`, keep only the info-toggle + more button visible on small widths.
   - Ensure the left identity block uses `min-w-0` with `truncate` so long org names don't push the actions offscreen.
   - Reduce header horizontal padding from `px-6` to `px-4 sm:px-6`.

3. **Info sidebar as drawer on <xl** — when toggled open below `xl`, render it as a right-side `Sheet` overlay instead of a grid column, so it never squeezes the chat pane.

4. **Container width** — keep `max-w-[1600px]`, add `min-w-0` on the middle column and remove any horizontal overflow on the outer card so message bubbles wrap correctly instead of extending past the pane.

## Files touched
- `src/routes/messages.tsx`
- `src/routes/organizations.$id.messages.tsx`
- `src/components/messages/ChatHeader.tsx`
- `src/components/messages/OrgInfoSidebar.tsx` (only if needed to work inside a Sheet)

## Out of scope
No changes to data, seed helpers, meeting pages, or navigation.
