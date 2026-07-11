## Changes

1. **Remove "Circularity & DPP" page**
   - Delete `src/routes/organizations.$id.circularity.tsx`
   - Remove the sidebar entry in `src/components/OrgSidebar.tsx` (line 58) and drop the unused `Recycle` icon import (line 14)
   - Leave `PassportCards.tsx` circularity metric alone (it's a dashboard stat, not a page link) — unless you want that removed too

2. **Community feed header cleanup**
   - In `src/components/feed/FeedWorkspace.tsx`, remove the description paragraph under the "Community feed" heading (the "Sustainability-only network for {entity.name}…" line, ~line 77-79). Keep the H1.

No other behavior changes.