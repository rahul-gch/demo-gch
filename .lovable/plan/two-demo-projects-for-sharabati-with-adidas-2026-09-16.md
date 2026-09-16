# Two demo projects for Sharabati with Adidas

Add two realistic, fully populated collaboration projects owned by Sharabati, with Adidas as an active partner, so you can demo how the Projects workspace works end to end.

Both organizations already exist in the platform (Sharabati, Egypt and Adidas, Germany), so no new accounts are needed.

## Project 1 — "Adidas SS27 Organic Denim Capsule"

- Status: Active, ~45% progress, running roughly Q3 2026 to Q1 2027
- Objectives: qualify organic cotton denim for the capsule, hit water-use targets, complete social audit before bulk
- Partner: Adidas as "Brand Partner", active, with view / comment / download / create-requests / upload permissions
- Content:
  - 3 requests (e.g. share GOTS certificate, submit washed sample set, confirm bulk lead times) across Open, In Progress and Completed
  - 3 discussion threads with a few replies and reactions
  - 2 meetings — one past kickoff with notes and action items, one upcoming review
  - 4 document entries (certificate, audit report, design file, contract) as records in the folders
  - Matching activity timeline entries

## Project 2 — "Adidas Recycled Fabric Traceability Pilot"

- Status: Planning, ~15% progress, starting later in the year
- Objectives: trace recycled polyester blends to source, pilot batch-level data capture, publish a traceability report
- Partner: Adidas as "Brand Partner", active, with view / comment / download permissions
- Content: 2 requests, 1 discussion thread, 1 upcoming kickoff meeting, 2 documents, activity entries

## Technical notes

- Seed via a database migration with literal INSERT statements into `projects`, `project_partners`, `project_requests`, `project_discussions`, `project_meetings`, `project_documents` and `project_activity`, using fixed UUIDs so the rows are re-runnable and easy to remove later.
- `owner_org_id` = Sharabati, partner `org_id` = Adidas; requests are split both directions (some assigned to Adidas, some raised by Adidas) so the inbox on both sides shows traffic.
- Document rows carry name/folder/size metadata only — no files are uploaded to storage, so download buttons will have nothing behind them.
- No application code changes; the existing Projects screens render the data as-is.
