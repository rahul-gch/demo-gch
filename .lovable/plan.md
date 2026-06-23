# Plan

## 1. Generic fallback dashboard

Today `DashboardByType` falls back to `BrandDashboard` for any unknown entity type — a non-brand org with no specific dashboard ends up rendering brand KPIs. Replace the fallback with a real `GenericEntityDashboard` so every org renders consistently.

`GenericEntityDashboard({ e })` will render:
- 4 StatTiles: Entity type, Location (city, country / region), Capacity (`e.capacity || "—"`), Lead time
- `ReliabilityCard` (existing)
- `ChipsCard` for Materials, Capabilities, Certifications (only when non-empty)
- A compact "Profile readiness" row: profile completeness %, verified certs, evidence count

Wire it as the `default:` case in `DashboardByType`. `BrandDashboard` stays only for `Brand`.

## 2. Research Workspace — replace screenshot-style placeholders with GCH-tailored content

The current `NewResearchDialog` uses generic copy ("knit fabric mills…Turkey", "Knitwear, denim", "Garment Factory, Mill…") copied from the screenshot. Make it context-aware to the viewing org and to the GCH network.

Changes in `ResearchWorkspace.tsx` / `NewResearchDialog`:

- **Dialog header**: keep "New research" but subtitle becomes:
  "Search the GCH network for partners that match **{entity.name}** ({entity.entityType}, {entity.country}). Ask in plain language — e.g. _ginners in India with BCI certification_."
- **Search query placeholder**: derived from the viewing org's role. Examples:
  - Brand → "Tier 2 spinners in Türkiye with GOTS and MOQ under 500 kg"
  - Garment Factory → "Trim suppliers in South Asia delivering within 21 days"
  - Farmer → "Ginners within 300km accepting organic seed cotton"
  - Spinner → "Fabric mills sourcing combed cotton Ne 30+"
  - Mill / Dye House / Logistics / Cert / Sustainability → tailored equivalents
  - Fallback → "Partners matching {entity.entityType} sourcing needs"
- **Countries placeholder**: use the org's `country` as default suggestion (e.g. "India, Bangladesh") instead of "Turkey, Portugal".
- **Industry → "Materials / focus"**: placeholder pulls from the org's first 2 materials (e.g. "Organic cotton, recycled polyester") with fallback "Cotton, polyester, trims".
- **Entity type**: rendered as a `<Select>` populated from the actual `EntityType` union (Brand, Farmer, Ginner, Spinner, Fabric Mill, Dye House, Garment Factory, Logistics Provider, Certification Body, Sustainability Partner) instead of a free-text "Garment Factory, Mill…". Default = the natural counterpart for the viewer (Brand → Garment Factory, Garment Factory → Fabric Mill, etc.) via a small `suggestedCounterpart()` map.
- **Footnote**: rewrite to "Searches {ALL_ENTITIES.length} organizations across the GCH network instantly. AI suggests additional candidates outside the network."

## 3. Per-org research search table

Today results render only after a run is opened. Add a persistent **"Network directory"** card at the top of every org's Research page so the org can scan the GCH network without starting a run:

- Live filter bar: search input + Entity type select + Country input + "Min on-time %" + "Max lead days".
- Filters `ALL_ENTITIES` (excluding self), renders `<Table>` with: Org · Type · Country · Materials (first 3 chips) · MOQ · Lead · On-time · Action ("Open").
- Defaults: prefilled with the org's suggested counterpart entity type and the org's country, so it shows something useful immediately.
- Empty state: "No GCH organizations match these filters. Try a New Research run to expand with AI."

This is the same data table the screenshot implies, but populated from our real seed network and scoped to the viewing org.

## Out of scope
- AI prompt logic / `runAiResearch` unchanged.
- No new entity types or schema changes.
- No changes to per-org sidebar, messaging, meetings, settings.

## Files to edit
- `src/components/DashboardByType.tsx` — add `GenericEntityDashboard`, switch `default` case.
- `src/components/ResearchWorkspace.tsx` — context-aware dialog placeholders, entity type Select, new `NetworkDirectoryCard` rendered above the runs grid.

No new files, no new routes, no new dependencies.
