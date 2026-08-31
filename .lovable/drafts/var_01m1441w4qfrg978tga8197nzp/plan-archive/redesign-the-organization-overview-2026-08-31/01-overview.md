# Redesign the Organization Overview

Rebuild the Overview tab to match the reference layout: a dark identity hero, one row of four KPI cards, then a three-column band of AI Brief / Recommended Actions / Passport progress, and a two-column footer of Operations Overview and Recent Activity.

Everything keeps working exactly as today — same data sources, same routes, same links and dialogs. Nothing is hardcoded to one organization; every value is derived from the organization being viewed, and empty/new organizations degrade gracefully (zeros, "no data yet" lines, hidden rows).

## One home per metric

Overview becomes a summary surface. Detail lives on its dedicated page.

| Metric | Shown on Overview as | Detail lives in |
| --- | --- | --- |
| Health score | KPI card number + band word | Performance tab |
| Profile completeness | KPI card + Passport progress card | Settings / profile |
| Trust & compliance | KPI card | Compliance page |
| Network size | KPI card | Network tab |
| Operations (lead time, MOQ, capacity, on-time) | Operations Overview strip | Operations / profile page |
| Activity | 4 most recent events | Activity tab |

Removed from Overview: the merged score ring card, the 2x2 stat tile block, the readiness sub-bars, the star rating and duplicated score chips in the hero, the separate missing-data card, the passport cards grid, and the showroom strip (stays on the Showroom page).
