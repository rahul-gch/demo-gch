# Fix: blank "page didn't load" screen and Organizations not loading

## What's happening

The error screen is a real crash, not a loading problem. The dropdown filters on the
Organizations page (and the Map page) build their option lists from the live
organization data — country, region, certifications, etc. Several organizations in
the database have those fields blank (confirmed: 3 with no country, 193 with no
region), so the filter builds a dropdown option with an empty value.

The dropdown component refuses an empty option value and throws, which takes down
the whole page and shows the "This page didn't load / Try again" screen. Because "/"
redirects into these pages after sign-in, it also looks like login is broken.

Console error confirming it:
`A <Select.Item /> must have a value prop that is not an empty string.`

## The fix

1. Drop blank values when building filter option lists on the Organizations page and
   the Map page (also trim whitespace-only values and de-duplicate).
2. Make the shared `FilterSelect` defensive: skip any option whose value is empty, so
   no future data gap can crash a page again.
3. Audit the remaining dropdowns that map over data (project panels: partners,
   certifications, statuses, fields; research workspace; acting-org switcher) and
   apply the same skip-empty guard where values come from data rather than fixed
   lists.
4. Verify by loading the Organizations page, Map page and post-login redirect in a
   browser check, confirming no console errors and that lists render.

No database, auth or navigation changes — this is a rendering-safety fix only.

## Technical notes

- `src/routes/_authenticated.organizations.index.tsx`: `uniq()` → filter out falsy /
  trimmed-empty strings; `FilterSelect` skips items with empty value.
- `src/routes/_authenticated.map.tsx`: same treatment for the country list and its
  local `FilterSelect`.
- `src/components/projects/panels.tsx`, `src/components/ResearchWorkspace.tsx`,
  `src/components/messages/ActingOrgSwitcher.tsx`: guard data-driven `SelectItem`
  values.
