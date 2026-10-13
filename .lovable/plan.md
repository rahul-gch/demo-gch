# GCH branding in organization workspace headers

## Goal
New organizations and their members currently see no Global Chain Hub branding anywhere in their workspace — the sidebar shows only the org's own identity. Per the chosen direction, add a small GCH logo to the top bar of the organization workspace only; the sidebar keeps showing the org name.

## Changes

1. **`src/components/GchLogo.tsx`** — add an optional `size` prop (`"sm" | "md"`, default `"md"`).
   - `"sm"` renders ~18px lettering with the divider/text kept proportional, so the wordmark fits the 56px header height without crowding.
   - `"md"` keeps the current 26px look used on signup, onboarding, and the admin sidebar.

2. **`src/components/OrgShell.tsx`** — render `<GchLogo size="sm" />` in the sticky header, at the left of the bar right after the sidebar toggle and navigation history buttons, before the existing divider and org name. This puts the platform brand at the left of the top bar on every org page (dashboard, feed, showroom, projects, etc.), while the org's own name and GCH number stay next to it.
   - The logo links to the org home (`/organizations/<org>`) as a visual anchor; no nav or page-flow changes.

3. **No change** to the admin console (it already carries the GCH wordmark in its sidebar) or to the organization sidebar (`OrgSidebar.tsx`), which keeps the org identity only, per the chosen option.

## Verification
- Typecheck passes.
- Playwright check on the org dashboard confirms the GCH wordmark appears left of the org name in the header and nothing else shifted.
