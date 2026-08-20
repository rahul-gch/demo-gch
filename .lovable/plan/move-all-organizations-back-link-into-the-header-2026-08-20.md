# Move "All organizations" back link into the header

Today, when an admin opens an organization workspace, the "All organizations" back link sits at the bottom of the left sidebar. Move it to the top header so it's immediately visible.

## What changes

- Remove the sidebar footer link from the organization sidebar.
- Add an "All organizations" button in the organization workspace header, right after the sidebar toggle and back/forward buttons.
- Only platform admins see it (same rule as today).
- On narrow screens it shows just the arrow icon; on wider screens it shows the arrow plus the label.

## Technical notes

- `src/components/OrgSidebar.tsx`: delete the `SidebarFooter` block (lines 112-125) and its now-unused imports.
- `src/components/OrgShell.tsx`: add the admin check (`useQuery` on `amIPlatformAdmin`, same query key as the sidebar so it's cached) and render a small `Button variant="ghost" size="sm" asChild` with `<Link to="/organizations">` containing `ArrowLeft` and a label hidden below `sm`.
- No route, data, or permission changes.
