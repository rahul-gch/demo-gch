# Add Abou Madawy as an organization

Create one new organization record in the directory with the cotton-supply details you provided, so it appears in Organizations, Directory, Map and matchmaking like any other listed company.

## Profile content

- **Name:** Abou Madawy
- **Type:** Cotton supplier / exporter (Ginner-tier entity, trading role)
- **Location:** Alexandria, Egypt (inferred from ALCOTEXA membership — tell me if that's wrong)
- **Materials / varieties:** Egyptian cotton G98, G86, G94, G92, G96, G97
- **Capacity:** Season 26/27 total supply approx. 125,000 MT — carryover 40,000 MT, production approx. 70,000 MT, currently available approx. 40,000 MT, new crop approx. 75,000 MT
- **Harvest season:** End of August to October
- **Certifications:** RegenAgri, ICA, BBB, ALCOTEXA
- **Minimum order quantity:** 10 MT
- **Lead time:** not provided — left blank so it shows as "Not reported"
- **Export markets:** India, Pakistan, China, Bangladesh, Portugal, Turkey
- **Pricing:** variable, updated weekly (stored as a profile note)

## Technical notes

- Insert a single row into the `orgs` table using the data tool (no schema change needed): name, slug `abou-madawy`, country, city, materials, certifications, capacity, MOQ, description.
- Season/harvest, export markets and pricing cadence go into `profile_answers` (JSONB) using the existing entity-profile field keys, plus a readable summary in `description` and `comments` so the public profile shows them even where no dedicated field exists.
- Set `profile_score` from the existing scoring rules rather than hardcoding, and leave `verification_status` unverified since no evidence documents were supplied.
- No owner user is attached; the org is unclaimed until someone is invited to it.

## Open point

If Abou Madawy should instead be created under a specific country/city, or be owned by a particular account, say so and I'll adjust before inserting.
