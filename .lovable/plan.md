
# Per-user dashboards (Rahul / George / Maria / Admin)

Today `/` shows the same ecosystem to everyone and only the admin tab has the graph/map. We'll give each non-admin persona their own dashboard that is **scoped to their org and direct partners**, with a map view, a risk panel, and quick actions (message / request meeting / view evidence).

No backend changes in this step — we keep using `ORGS`/`EDGES`/`USERS` from `src/lib/ecosystem-data.ts` and the existing `localStorage` messaging. (Cloud migration stays as a separate follow-up.)

## 1. New helper — `src/lib/user-scope.ts`

Pure functions, no UI:

- `getOrgForUser(role)` → returns the `EcosystemOrg` for Rahul (`acme`), George (`northwind`), Maria (`starkv`).
- `getPartners(orgId)` → walks `EDGES` and returns `{ org, edge, direction: "in"|"out", kind }[]` for every org directly connected to `orgId` (supply + verification + partnership).
- `getPartnerIds(orgId)` → `Set<string>` of `orgId + partners`, used to filter graph/map.
- `getRiskSignals(orgId)` → for the org's partners, returns:
  - `highRiskPartners`: partners where `risk > 0.5`
  - `missingEvidenceEdges`: edges where `evidenceCount === 0`
  - `lowConfidencePartners`: partners where `confidence < 0.6`
  - `flaggedPartners`: partners where `status === "Flagged"`
  - aggregate `avgPartnerRisk`, `avgPartnerConfidence`
- `getTopMatchSuggestions(orgId, n)` → reuses `topMatches()` from `matchmaking.ts` filtered to orgs that are **not already partners** (i.e. new connection suggestions).

## 2. New component — `src/components/UserDashboard.tsx`

Single component that takes `{ user: DemoAccount }` and renders the scoped dashboard. Layout:

```text
┌─ Header strip: org name, type, country, tier, size, status, confidence/risk meters
├─ KPI row (4 cards): Partners count · High-risk partners · Missing evidence · Open messages
├─ Tabs: [ My Network ] [ Map ] [ Risk ] [ Suggested Matches ] [ Activity ]
│   • My Network: <EcosystemGraph> filtered to {org + partners}, click → side drawer
│       with partner details, "Message" + "Request meeting" buttons (open MessagesPanel
│       prefilled with that orgId's primary user from USERS).
│   • Map: <EcosystemMap> filtered to the same id set, same drawer behaviour.
│   • Risk: table of partners sorted by risk desc, with badges (risk, confidence,
│       evidence count, status) + per-row "Request evidence" action that opens
│       a meeting request prefilled with subject "Evidence review".
│   • Suggested Matches: list from getTopMatchSuggestions() with score breakdown
│       (reusing the factor display from how-it-works), each with "Introduce" CTA
│       (sends a message via existing messaging.ts).
│   • Activity: recent messages + meetings involving this user (read from
│       gch_comms_v1 via existing messaging.ts helpers).
```

Maria (verifier) sees the same layout but her "partners" are the brands/suppliers she verifies (already encoded as `verification` edges from `starkv`), and the Suggested Matches tab is renamed "Audit candidates".

## 3. Extend `EcosystemGraph` and `EcosystemMap`

Both already accept org lists implicitly through `ORGS`. Add an optional `includeIds?: Set<string>` prop:

- `EcosystemGraph`: when `includeIds` is passed, filter `visible` to those ids and skip `coreOnly` layout. Re-flow nodes onto a simple radial layout centred on the user's org (org in centre at 50/50, partners spaced on a circle of radius 32). Edges already filter by `visibleIds`.
- `EcosystemMap`: when `includeIds` is passed, only plot those orgs and auto-fit bounds to them; also draw thin polylines between the user's org and each partner, coloured by edge kind.

No change to existing call sites (admin view keeps full ecosystem).

## 4. Wire into `src/routes/index.tsx`

- Detect current persona via `getCurrentUser()`.
- If `role === "admin"` → keep current admin overview (graph/map toggle stays).
- Otherwise → render `<UserDashboard user={...} />` instead of the current shared content.
- Header keeps "How it works", "Messages", and persona switcher.

## 5. "Risk assessment from other entities"

Inside the Risk tab, for each partner also show **incoming verifications** (edges of kind `verification` pointing at that partner from any verifier) with the verifier's name, evidence count, and last-active timestamp. This is a read-only roll-up from `EDGES` — gives Rahul a "what do auditors say about my suppliers" view and George a "who has verified me" view.

## Files

- **Create:** `src/lib/user-scope.ts`, `src/components/UserDashboard.tsx`
- **Modify:** `src/components/EcosystemGraph.tsx` (add `includeIds` + radial layout branch), `src/components/EcosystemMap.tsx` (add `includeIds` + fit-bounds + partner polylines), `src/routes/index.tsx` (persona-based switch)

## Out of scope

- Persisting dashboards / per-user customisation (no backend yet).
- New matchmaking factors — Suggested Matches reuses existing `scorePair`.
- Editing `how-it-works` content.

Once you approve I'll implement it.
