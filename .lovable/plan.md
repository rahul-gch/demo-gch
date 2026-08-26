# Add Embee Group as an organization

Create one new organization record in the directory using the public information from embeegroup.com, so Embee Group appears in Organizations, Directory, Map and matchmaking like any other listed company.

## Profile content

- **Name:** Embee Group of Companies
- **Website:** https://embeegroup.com
- **Type:** Vertically integrated apparel manufacturer (Garment Factory; manufacturer tier)
- **Headquarters:** Sharjah, United Arab Emirates (Embee Readymade Garments, Industrial Area 4, PO Box 2509)
- **Other sites:** Embee International Ind (Ismailia Free Zone, Egypt), Plaza Readymade Garment Ind (Port Said and Suez, Egypt), Canon Global Industries (Amreya, Alexandria Free Zone, Egypt)
- **Founded / heritage:** manufacturing apparel since 1972
- **Capabilities:** cotton growing, spinning, weaving, knitting, dyeing, printing, embroidery, laundry, thread manufacturing, woven and heat-seal labels, cartons, buttons, garment manufacturing
- **Specializations:** ethical / sustainable garment manufacturing, low-impact fiber-reactive dyeing, reduced-impact packaging
- **Key clients (public):** Adidas, Lee, Levi's, Decathlon, Walmart, French Toast, Alpha Broder, Wonder Wink, Li & Fung, Koogi
- **Compliance:** CPSIA compliance for children's product safety; third-party testing via ITS, SGS, MTL
- **Contact:** info@embeegroup.com, +971 6 5325116
- **Not published on the site (left blank so they show as "Not reported"):** MOQ, lead time, annual capacity figures, formal certifications such as GOTS/OEKO-TEX

## Technical notes

- Insert a single row into the `orgs` table via the data tool: name, slug `embee-group`, country UAE, city Sharjah, organization type, website, description, capabilities, specializations, product categories, contact email.
- Multi-country plant list, client list, CPSIA/third-party testing notes and heritage year go into `profile_answers` (JSONB) using the existing entity-profile field keys, with a readable summary in `description` and `comments` so the public profile surfaces them where no dedicated field exists.
- `profile_score` computed from the existing scoring rules rather than hardcoded; `verification_status` stays unverified since no evidence documents were supplied.
- No owner user attached — the org stays unclaimed until someone is invited to it.
- Nothing else in the app changes; no schema change and no new UI.

## Open point

The site lists no formal certifications, capacity or MOQ. If you have those details (or want the Egypt plants created as separate organizations instead of one group record), tell me and I'll adjust before inserting.
