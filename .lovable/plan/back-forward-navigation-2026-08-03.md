# Back / Forward Navigation

Add browser-style back and forward buttons to the app header so you can move between pages you've already visited, in both directions.

## What you'll see

- Two small icon buttons (left chevron = back, right chevron = forward) at the top-left of every page header, right next to the sidebar toggle.
- Buttons are greyed out and unclickable when there's nothing to go back or forward to.
- Works everywhere: admin pages, organization workspaces, messages, meetings, dashboard, directory.
- Tooltips ("Back" / "Forward") and keyboard/screen-reader labels.

## Technical notes

- New component `src/components/NavHistoryButtons.tsx` using the router's `history.back()` / `history.forward()`.
- Tracks an internal index of history length vs. position (the browser API doesn't expose "can go forward"), so the forward button enables only after a back step and resets on a new navigation.
- Rendered in `src/components/AppShell.tsx` and `src/components/OrgShell.tsx` headers, immediately after `SidebarTrigger`. Hidden on very small screens only if space is tight — otherwise always visible.
- No route, data, or layout structure changes.
