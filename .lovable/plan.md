## Fixes for Org Dashboard Banner + Hero Stats

### 1. Reposition logo medallion (OrgBanner)
In `src/components/dashboard/OrgBanner.tsx`:
- Change centered-flex wrapper to an absolute-positioned medallion anchored to the bottom-center, overlapping the banner edge (`absolute left-1/2 -translate-x-1/2 -bottom-12`), so it sits half over the banner and half over the hero card below (as marked in the screenshot).
- Add bottom padding/margin on the banner section (`mb-14`) so the overhanging logo doesn't collide with the HeroPassport card.
- Keep white ring + shadow. Slightly reduce medallion size for balance (`h-24 w-24 md:h-28 md:w-28`).

### 2. Make stat tiles readable (HeroPassport)
The tiles (NHRI SCORE, PROFILE, GLOBAL RANK, MEMBERS, PROJECTS, PARTNERS) currently use `bg-card/60` with muted foreground on the dark hero → labels and numbers appear washed out grey.

In `src/components/dashboard/HeroPassport.tsx` `Stat` component:
- Change container to `bg-white/10 border-white/15` (proper dark-surface tile).
- Label: `text-white/70` instead of `text-muted-foreground`.
- Value: `text-white text-xl` for stronger contrast and larger read.
- Icon: `text-sky-300` for accent instead of muted grey.

### 3. No other changes
No changes to routing, seed data, or other tabs. Purely presentational.

### Files
- `src/components/dashboard/OrgBanner.tsx` — reposition medallion, add bottom offset.
- `src/components/dashboard/HeroPassport.tsx` — restyle `Stat` for dark background readability.
