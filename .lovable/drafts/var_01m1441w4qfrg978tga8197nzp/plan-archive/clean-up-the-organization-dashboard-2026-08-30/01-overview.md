# Clean up the organization dashboard

The dashboard currently shows the same blocks in several places at once. Confirmed duplicates in the current code:

- Health score card renders in both the Performance tab and the AI tab.
- KPI grid renders in Overview and again in Performance.
- Opportunities panel renders in Overview and again in Insights.
- Profile-completeness ("missing data") renders in Overview and again in AI.
- Activity timeline renders in Overview and again in the Activity tab.
- Global rank is shown twice: as a hero stat and inside the score card.

Goal: one home for each piece of information, fewer tabs, and no global rank anywhere.
