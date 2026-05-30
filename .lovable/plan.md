## GCH Admin dashboard rebuild

Focus on three things you flagged: an ecosystem graph that actually carries information, real user/org management, and a matchmaking control panel with toggleable parameters. Also clean up the header so admin doesn't see the "Rahul / George / Maria" persona pills.

---

### 1. Header cleanup (applies to admin only)

Today the header shows Rahul / George / Maria / GCH Admin / Org Profile as round pills. For admin that looks like 4 user accounts, which is wrong.

New behavior for GCH Admin:
- Replace the persona pills with three real admin tabs: **Overview**, **Organizations & Users**, **Matchmaking settings**.
- A small "View as…" dropdown (top-right, next to Sign out) lets admin preview Rahul / George / Maria workspaces. Clearly framed as preview, not as identity switching.
- Rahul / George / Maria continue to see their own single pill + Org Profile (unchanged).

### 2. Informational ecosystem graph

Right now `EcosystemGraph.tsx` renders 10 generic nodes with no context. Rebuild it as a real ecosystem map.

Data model (mock, in-file):
- ~18 organizations with: `name`, `type` (brand / supplier / verifier / regulator), `tier` (1/2/3), `country`, `sizeBand` (S/M/L), `certifications[]`, `confidence` (0–1), `riskScore` (0–1).
- ~30 relationships with: `from`, `to`, `kind` (supply / verification / partnership), `strength` (0–1), `evidenceCount`.

Graph UX:
- Color by type (brand / supplier / verifier / regulator), size by `sizeBand`, ring intensity by `confidence`, red halo when `riskScore > 0.6`.
- Edges thicker with `strength`, dashed when `evidenceCount === 0` (missing evidence).
- Legend with counts (e.g. "Brands · 5", "Risk halos · 3").
- Hover a node → side panel shows org details, top connections, and a "Suggested matches" list produced by the matchmaking algorithm (see §4).
- Filter chips above the graph: type, tier, region, certification, "show only risk", "show only missing evidence". Filters update both the graph and the insight panels around it.

### 3. Organizations & Users tab

Replace the tiny 4-row list with a real admin table.

- **Organizations table**: name, type, country, size, users count, verification status, risk score, last activity. Sortable headers, filter by type / country / status. Row click opens a side drawer with org details + a mini graph of its connections.
- **Users table** (below): name, org, role, last login, status (active / invited / suspended). Filter by role and org. Bulk actions: suspend, resend invite, change role.
- Seed with ~18 orgs and ~25 users matching the graph data so everything stays consistent.

### 4. Matchmaking algorithm + settings panel

A single scoring function used everywhere (admin graph hover, Rahul/George/Maria matchmaking panels).

Score (0–100) for a candidate pair `(A, B)`:

```text
score =  w_type        * typeFit(A,B)              // brand↔supplier↔verifier compatibility
       + w_tier        * tierFit(A,B)              // adjacent tiers preferred
       + w_geo         * geoProximity(A,B)         // same country=1, same region=0.6, else 0.2
       + w_size        * sizeFit(A,B)              // capacity match
       + w_cert        * certOverlap(A,B)          // shared certifications / total
       + w_history     * coOrderHistory(A,B)       // prior interactions
       + w_confidence  * min(conf_A, conf_B)
       - w_risk        * max(risk_A, risk_B)
```

All weights live in admin-controlled state. Default weights documented in `MATCH_DEFAULTS`.

**Matchmaking settings panel** (admin-only, persisted to `localStorage` under `gch_match_settings`):
- Master toggle: matchmaking on/off.
- Per-rule toggle + weight slider (0–100) for each of the 8 factors above.
- Hard filters (toggle + value):
  - Same country only
  - Min company size (S / M / L)
  - Max distance band (local / regional / global)
  - Required certifications (multi-select)
  - Exclude orgs with risk > X (slider)
- Confidence governance: keep the existing auto-accept / review / reject thresholds, wire them to the score output.
- Live preview card: "With current settings, 42 of 124 candidate pairs would auto-match." Recomputes as toggles change.

### 5. Files

- **Edit** `src/components/EcosystemGraph.tsx` — accept `nodes`, `edges`, `onSelect`, `filters` props; render type/size/risk encoding and dashed missing-evidence edges.
- **Create** `src/lib/ecosystem-data.ts` — 18 orgs + 30 relationships + 25 users (typed).
- **Create** `src/lib/matchmaking.ts` — `scorePair`, `topMatches`, `MATCH_DEFAULTS`, settings type, localStorage helpers.
- **Edit** `src/routes/index.tsx`:
  - Admin header swaps persona pills for Overview / Orgs & Users / Matchmaking tabs + "View as…" preview dropdown.
  - Rewrite `AdminDashboard` into three tab views using the new data + algorithm.
  - Wire Rahul/George/Maria matchmaking panels to `topMatches` so they reflect admin's settings.

### Out of scope

- No real backend / persistence beyond `localStorage`.
- No new auth changes — existing demo accounts unchanged.