# Tidy the "All organizations" header button

In the organization workspace header, the "All organizations" link currently sits loose between the back/forward arrows and the org name, using a plain arrow + text that doesn't match the rest of the header.

## What changes

- Group the sidebar toggle, back/forward arrows and the "All organizations" link into one cluster, separated from the org name by a thin vertical divider — so the header reads as "navigation controls | organization identity".
- Restyle the link as a compact outlined pill (subtle border, rounded, small text) matching the header's other controls, with the same 7px-tall control height as the arrows instead of the taller default button.
- Swap the plain left arrow for a building/grid icon with a small chevron feel so it reads as "go to the organizations list", not "browser back" (which the arrows next to it already do).
- On narrow screens it collapses to the icon only, with an accessible label and tooltip.
- Org name and GCH number stay where they are, with a bit more breathing room.

## Technical notes

- Only `src/components/OrgShell.tsx` changes: wrap `SidebarTrigger`, `NavHistoryButtons` and the link in a `flex items-center gap-1` cluster followed by a `h-5 w-px bg-border` divider.
- Replace `variant="ghost" size="sm"` with `variant="outline" size="sm"` plus `h-7 rounded-full px-2.5 text-xs`, icon `h-3.5 w-3.5`, label `hidden md:inline`.
- Wrap in the existing shadcn `Tooltip` (same pattern as `NavHistoryButtons`) so the icon-only state stays discoverable.
- No route, permission, or data changes.
