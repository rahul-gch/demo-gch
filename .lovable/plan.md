# Role-Scoped Navigation + Matchmaking

Three focused changes.

## 1. Lock the role switcher to the signed-in user

Today every signed-in user can see all role pills (Rahul, George, Maria, GCH Admin, Org Profile) in the header and freely switch workspaces. That's wrong.

New behavior:
- **Rahul / George / Maria**: header shows only **their own workspace pill** + **Org Profile**. They cannot see or open the other personas.
- **GCH Admin**: keeps the full switcher (Rahul, George, Maria, GCH Admin, Org Profile) — admin is the only one who can preview other roles.
- Hard guard: if a non-admin somehow lands on another role's view, it falls back to their own dashboard.

## 2. Add a Matchmaking feature per persona

A new "Matchmaking" section appears on each of the 3 user dashboards with role-appropriate framing. Same underlying concept (suggested ecosystem partners with a confidence score, reason, and accept/dismiss), different content:

- **Rahul (Brand Lead)** — *Suggested suppliers & verifiers*
  - 4–5 suggested partners (e.g. "Tyrell Dyeworks — 92% match, fills your Tier-2 dye gap for Hemp Knit Sweater")
  - Filters: tier needed, region, certification
  - Actions: Invite to connect, Request evidence, Dismiss

- **George (Supplier Ops)** — *Brand opportunities*
  - 4–5 brands looking for capacity matching George's facility (e.g. "Acme Apparel — needs GOTS-certified knitting, 88% match")
  - Shows lead time / volume / certification fit
  - Actions: Express interest, Send capability deck, Dismiss

- **Maria (Evidence Reviewer)** — *Verification assignments*
  - 4–5 partner pairs needing a reviewer (e.g. "Acme ↔ Northwind — chain-of-custody review, 94% routing confidence")
  - Shows evidence type, SLA, complexity
  - Actions: Claim review, Reassign, Dismiss

Each card uses the existing `Panel` / `Pill` primitives so it stays consistent with the current design.

## 3. Expand dummy data on the 3 user dashboards

Round out the existing sections with more realistic sample data:
- **Rahul**: more products (8 total), more partner requests (5), small "Recent traceability events" feed
- **George**: more tasks (7), more uploads (6), a "Production lines" mini-status block (Knitting / Dyeing / Cutting / Finishing / QA)
- **Maria**: an evidence review queue (6 items with AI confidence %), a "Missing data" list per partner, and a "Coordination threads" panel

## Out of scope (per your message)

- The main GCH Admin dashboard stays as-is for now — we'll work on it next.

## Files

- **Edit** `src/routes/index.tsx`
  - Filter `ROLES` array shown in header based on `user.role`
  - Default + clamp `active` state to the signed-in role (non-admins)
  - Add `RahulMatchmaking`, `GeorgeMatchmaking`, `MariaMatchmaking` panels and expanded dummy data in each role's dashboard
