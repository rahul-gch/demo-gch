## Match profile sheet — cleanup + narrative "Why this match"

Rework the Match Profile side sheet used across Matchmaking, Supply chain recommendations, and Ecosystem.

### Changes in `src/components/MatchProfileSheet.tsx`

1. **Remove the "Why this is a match" chip list and the per-factor progress bars** (Material / Cert / Tier / Region / Kpi / Capacity / Delivery). Drop the `MatchScore`/`scoreMatch` import and the `detail` block.
2. **Remove the top-right "% match" badge** in the header (keeps the sheet score-free per earlier request).
3. **Add an Accordion "Why this match"** (shadcn `Accordion`, single, collapsible, closed by default) rendering a short paragraph explanation, generated from viewer + partner:
   - Sentence 1: tier relationship (e.g. "Direct adjacent-tier supply fit between a Brand and a Tier‑2 Fabric Mill.")
   - Sentence 2: material / capability / product overlap (list up to 3 shared items).
   - Sentence 3: region / country note.
   - Sentence 4: reliability note using lead time + on-time rate.
   - Sentence 5: certification alignment (shared certs, or "Certifications align with your compliance profile").
   - Falls back gracefully with dummy but plausible sentences when a field is missing.
4. **Fill Operations with dummy data when fields are empty** — reuse the existing `reliabilityOf` pattern and add deterministic fallbacks derived from `e.id` hash so the same org always shows the same values:
   - Lead time: existing or 28–45 d
   - Delivery timeframe: existing or lead time + 3
   - On-time rate: existing or 88–97%
   - Avg delay: existing or 0–4 d
   - Capacity: existing or e.g. "120,000 units / month" (spinner: "8,500 kg / day", mill: "180,000 m / month", garment: "120,000 pcs / month", etc. picked from entityType)
   - MOQ: existing or e.g. "1,000 pcs" (varies by entityType)
5. Keep Materials, Certifications, Send-a-message, and Open full profile sections unchanged.

No other files change. No backend, no schema.
