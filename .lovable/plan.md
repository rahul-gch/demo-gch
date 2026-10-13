# Signup copy + welcome page alignment

## 1. Signup brand panel copy (`src/routes/signup.tsx`)

- Replace the headline "The verified network for textile and apparel supply chains." with:
  **"B2B Partnership Platform for the Global Textile Supply Chain"**
- Delete the subtext paragraph "Connect with brands, mills and factories, share credentials once, and run projects with your partners."
- The three trust points (Verified organizations / Matchmaking that fits / Private by default) stay unchanged; spacing is adjusted so the headline doesn't leave the panel feeling empty.

## 2. Welcome page (`src/routes/welcome.tsx`)

The welcome page still serves a real purpose: it is the landing page for signed-in users who don't belong to an organization yet (invite joiners from `/onboarding/$token`, and anyone opening `/welcome` from the user menu or sidebar). It should stay, but be brought in line with the new brand:

- Replace the Globe2 icon + "Global Chain Hub" text with the shared `GchLogo` wordmark (same component used on signup/auth).
- Remove the old slate gradient background; use the plain background like the rest of the onboarding pages.
- Keep the card structure and the "Create a new organization" / "Join an existing organization" choices unchanged — no flow changes.
- Keep head metadata; no route or navigation changes.

## Verification

- Screenshot the signup brand panel (desktop) and the welcome page after the edits.
- Check build-errors.log is clean.
