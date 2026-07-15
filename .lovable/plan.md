# Org Dashboard Banner Carousel + Centered Logo

Add a hero banner strip at the very top of every org dashboard (`/organizations/:id`) — a rotating image carousel in the background with the company logo pinned in the center in front of it.

## Where it goes

Above `HeroPassport` inside `OverviewMissionControl` in `src/routes/organizations.$id.index.tsx`. Everything below stays untouched.

## New component: `src/components/dashboard/OrgBanner.tsx`

Props: `entity: Entity`.

Structure:
```
<section relative h-56 md:h-72 rounded-2xl overflow-hidden border>
  ├── Carousel layer (absolute inset-0)
  │     4-5 slides, auto-advance every 5s, fade transition
  │     dark gradient overlay for logo legibility
  ├── Dots indicator (bottom-right)
  └── Logo medallion (absolute center)
        white/blur circular badge, ~112px, ring + shadow
        shows company logo via Logo.dev (already a connector in project)
        fallback: initials from entity.name on a branded background
</section>
```

### Carousel behavior
- Pure React state (`useState` index + `useEffect` interval). No new dependency — shadcn `carousel` also available if preferred.
- Pause on hover.
- Prev/next chevrons visible on hover (desktop only).
- Fade (opacity) transition, not slide, so the centered logo stays visually anchored.

### Image sources (per entity, deterministic)
To avoid manual asset work for 100+ orgs, pick 4 images from a curated Unsplash topic pool keyed by `entity.entityType`:
- Brand → retail / storefront / apparel
- Farmer → cotton field / farm
- Ginner / Spinner / Fabric Mill → textile machinery
- Dye House → fabric dyeing
- Garment Factory → sewing floor
- Logistics Provider → shipping containers / ports
- Certification Body / Sustainability Partner → office / labs

Implementation: a small map in `OrgBanner.tsx` from `EntityType` → array of 4 Unsplash URLs (`https://images.unsplash.com/photo-...?w=1600&q=70`). Deterministic per type, so the same org always shows the same set.

Showcase orgs (`NIKE`, `HM`, `MANDS`, `PRIMARK`) get an override map with brand-appropriate imagery.

### Logo
Use existing Logo.dev connector pattern:
```
https://img.logo.dev/{domain}?token={VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY}&size=200&format=png
```
Domain resolution:
1. If entity has a `website`/`domain` field, use it.
2. Else derive from name: `nike.com`, `hm.com`, `marksandspencer.com`, `primark.com` for showcase orgs; for generic seed orgs, slug the name (`entity.name.toLowerCase().replace(/[^a-z0-9]/g, "")` + `.com`).
3. `<img onError>` swaps to an initials fallback (first letters of name on `bg-slate-900 text-white` circle).

No entity-schema changes; domain derivation stays inside the component.

## Route wiring

Edit `src/routes/organizations.$id.index.tsx` — in `OverviewMissionControl`, render `<OrgBanner entity={e} />` as the first child before `<HeroPassport />`.

## Out of scope
- No changes to `HeroPassport`, sidebar, or other tabs.
- No new backend, storage, or seed fields.
- No upload flow for custom banners (can be a follow-up if you want per-org uploads later).

## Technical details

- File created: `src/components/dashboard/OrgBanner.tsx`
- File edited: `src/routes/organizations.$id.index.tsx` (one import + one JSX line)
- Deps: none new (uses existing `lucide-react`, Tailwind, Logo.dev env var already wired)
- Accessibility: carousel has `aria-roledescription="carousel"`, dots are buttons with `aria-label`, auto-advance pauses on focus/hover, logo `<img>` has alt text.
