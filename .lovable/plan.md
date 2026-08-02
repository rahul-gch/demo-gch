# Connect globalchainhub.io: Landing page (apex) + App (subdomain)

Two Lovable projects, two hostnames on one domain:

```
globalchainhub.io  ─────────────►  Landing page project (Fashion Connect Hub)
www.globalchainhub.io ──────────►  Landing page project (Fashion Connect Hub)
app.globalchainhub.io ──────────►  THIS app project (Global Chain Hub)
```

Landing page keeps its current design. Its single "Sign up" button (and "Sign in" link) point to `https://app.globalchainhub.io/signup` and `https://app.globalchainhub.io/auth`. Everything else (org dashboards, messaging, meetings, matchmaking, admin) lives on the app subdomain.

---

## Track A — Landing page project (Fashion Connect Hub)
*Done inside that project — I cannot write to it from this session, so open it and apply these edits, then publish + connect the apex domain there.*

The landing page currently uses a waitlist email form (writes to `waitlist_signups`) and "Join Waitlist" scroll buttons. Replace them with a single "Sign up" button that links off-domain to the app.

**1. `src/components/landing/LandingHeader.tsx`**
- Desktop: change `<Link to="/login">Sign In</Link>` → `<a href="https://app.globalchainhub.io/auth">Sign In</a>`
- Desktop + mobile: change `<a href="/#pricing">Join Waitlist</a>` → `<a href="https://app.globalchainhub.io/signup">Sign Up</a>` (rename label "Join Waitlist" → "Sign Up")
- Mobile sheet: same two changes (Sign In link + Sign Up button)

**2. `src/components/landing/HeroSection.tsx`**
- Replace the "Join Waitlist" button's `onClick` (scrolls to #pricing) with a plain link to `https://app.globalchainhub.io/signup` and rename it "Sign Up". Keep the "Learn More" button as-is.

**3. `src/components/landing/CTASection.tsx`**
- Remove the waitlist form + `waitlist_signups` insert. Replace the whole form block with one button linking to `https://app.globalchainhub.io/signup` (label "Sign Up"). Drop the now-unused `useState` and `supabase` import.

**4. Check the Pricing section** (search for any other `Join Waitlist` / `waitlist_signups` references) and apply the same single-button redirect.

**5. Publish** the Fashion Connect Hub project (it is already published/public — republish after the CTA edits).

**6. Connect the apex domain** in that project: Project Settings → Project → Domains → Connect Domain → enter `globalchainhub.io`, then add `www.globalchainhub.io` separately. Follow the on-screen DNS records (A → 185.158.133.1 for `@` and `www`, plus the `_lovable` TXT). Set `globalchainhub.io` as Primary so `www` redirects to it. If the domain sits behind Cloudflare, expand Advanced and enable "Domain uses Cloudflare or a similar proxy".

---

## Track B — This app project (Global Chain Hub)  ← done here

**1. Verify the app behaves correctly as the subdomain target (no code change needed — confirm only):**
- `/` (`_authenticated.index.tsx`) already redirects: platform admins → ops console; other users → their org dashboard; users with no org → `/signup`. The `_authenticated` gate sends logged-out visitors to `/auth`. So `app.globalchainhub.io/` lands people on sign-in, their dashboard, or signup — exactly right.
- `/signup` and `/auth` are public routes and work standalone.

**2. Publish this app** so a `.lovable.app` subdomain exists (required before a custom domain can connect). I'll run the publish here on approval. (Optional: set the Lovable slug to something clean like `gch-app`.)

**3. Connect the subdomain** in this project: Project Settings → Project → Domains → Connect Domain → enter `app.globalchainhub.io`. Follow the on-screen record (a CNAME or A record for `app` — use exactly what the setup flow shows; if Cloudflare-proxied, enable proxy mode in Advanced). Wait for verification + SSL ("Active").

**4. Sanity-check:** open `https://app.globalchainhub.io/signup` — the Create-org / Join-invite form loads; open `https://app.globalchainhub.io/auth` — sign-in works with the Google + email flows already wired.

---

## DNS summary (at your registrar / DNS provider)
```
@    A     185.158.133.1        (landing page)
www  A     185.158.133.1        (landing page, redirects to apex)
_lovable TXT  lovable_verify=…   (landing project verification)
app  <record from app setup flow>  (this app — follow the connect flow)
```
Use the exact values Lovable shows in each project's domain setup; don't guess. Allow up to 72h propagation (usually minutes).

---

## Things to know
- **Two separate backends:** the landing page project has its own Supabase (waitlist + its own dead `/login`). This app uses Lovable Cloud. Pointing all CTAs to `app.globalchainhub.io` means auth and data all live on the app side; the landing page's own `/login` / `/signup` routes become unused — that's expected and fine.
- **One primary per project:** each project owns different hostnames, so there's no apex conflict.
- **No routing changes in this app are required** — it already routes visitors to sign-in / signup / dashboard correctly.

## What I will execute (on approval, build mode)
- Publish this app project (creates its `.lovable.app` URL so the custom subdomain can attach).
- Provide the ready-to-paste patched versions of the three landing-page component files for you to drop into the Fashion Connect Hub project (I cannot write them there directly).
- Walk you through the two domain-connection flows.
