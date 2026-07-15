## Merge banner carousel with hero + fix stat readability

### 1. Merge carousel into the hero (no white gap)
Currently `OrgBanner` renders as a separate card above `HeroPassport` with a gap and a floating medallion between them. Replace this with a single unified hero:

- Delete the standalone `<OrgBanner />` render in `src/routes/organizations.$id.index.tsx`.
- Refactor `HeroPassport.tsx` so the image carousel becomes the **background** of the hero card itself (absolutely positioned, `inset-0`, behind content with a dark gradient overlay for legibility).
- Move the rotating slides + prev/next + dots logic into `HeroPassport` (or a small `HeroBackground` subcomponent it renders internally). The gradient `from-slate-950 via-slate-900 to-slate-800` becomes a semi-transparent overlay on top of the carousel instead of a solid fill.
- Result: org name, badges, and stats sit directly on top of the moving carousel — no white space, no separate banner.

### 2. Logo medallion inside the hero
- Place the circular logo medallion inside the hero, aligned with the title row (left of the name on `md+`, above name on mobile) instead of floating between two cards.
- Size `h-16 w-16 md:h-20 md:w-20`, white ring, subtle shadow.

### 3. Fix stat tile alignment + readability
In `HeroPassport`'s `Stat`:
- Left-align label and value consistently (`items-start`, no icon-induced shifting).
- Icon sits inline before the value with fixed width so numbers align across tiles.
- Use `bg-white/10 border-white/20`, `text-white` value at `text-lg md:text-xl`, `text-white/75` label, `text-sky-300` icon.
- Ensure grid is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` with even `gap-3` so tiles don't feel cramped.
- Truncate long values (`#globalRank`) with `tabular-nums` + `truncate` on the value span.

### 4. Right-side "AI says" panel
Keep as-is but bump contrast: `bg-black/30`, `border-white/15`, ensuring it reads against the carousel background.

### Files
- `src/components/dashboard/HeroPassport.tsx` — absorb carousel as background; restyle Stat; place logo medallion inline with title.
- `src/components/dashboard/OrgBanner.tsx` — reduce to internal `HeroBackground` (carousel only, no medallion, no outer card), OR delete and inline into HeroPassport.
- `src/routes/organizations.$id.index.tsx` — remove separate `<OrgBanner />` render; hero is now a single unit.

No routing, seed, or other tab changes.
