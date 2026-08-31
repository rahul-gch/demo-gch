## Changes

**Remove global rank entirely**
- Drop the "Global Rank" hero stat and replace it with profile-relevant info (kept: score, profile %, members).
- Drop the "rank #x of y" line under the score ring; keep the band label only.

**Merge tabs from 7 to 5**
- Delete the Insights and AI tabs. Their unique value (AI findings, opportunities, critical actions) moves into the Overview action queue, which already merges critical actions and suggestions.
- Remaining tabs: Overview, Performance, Network, Documents, Activity.

**One home per block**
- KPI grid: Performance only (removed from Overview; Overview keeps the stat tiles).
- Health/readiness score: Overview only (Performance loses the duplicate card).
- Opportunities and critical actions: folded into the Overview action queue.
- Missing data: Overview right rail only.
- Activity timeline: Activity tab only; Overview right rail shows a short "recent activity" excerpt with a link, not the full list.

**Cleaner Overview rhythm**
Hero → score card + stat tiles → action queue → showroom (manufacturers) → passport → operations, with a right rail of profile completeness plus recent-activity excerpt.

## Technical notes

- Edits are confined to `src/routes/_authenticated.organizations.$id.index.tsx` (tab list and composition), `HeroPassport.tsx` (rank stat), `ScoreCard.tsx` (rank line), and `ActionQueue.tsx` (absorb AI findings/opportunities rows).
- No scoring logic changes: `computeNhri` keeps returning rank fields, they simply stop being rendered.
- Components no longer referenced by the route (`HealthScoreCard`, `ReadinessBreakdown`, `CriticalActionsStrip`, `AICommandCenter`) are removed from this page; files stay in place if used elsewhere.
