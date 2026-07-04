# Partner Collaboration Workspace — Projects Section

Build a modern, enterprise-grade multi-org collaboration workspace inside each organization's Projects area. All state is local (localStorage-backed seed store) matching the existing Feed/Comms pattern — no backend changes.

## Routes (file-based, TanStack)

Replace the current `ComingSoon` placeholder at `organizations.$id.projects` with a real projects index + project detail with nested tabs.

```
src/routes/
  organizations.$id.projects.tsx              -> Projects list (replaces placeholder)
  organizations.$id.projects.$projectId.tsx   -> Project layout w/ inner sidebar + <Outlet/>
  organizations.$id.projects.$projectId.index.tsx     -> Overview
  organizations.$id.projects.$projectId.partners.tsx
  organizations.$id.projects.$projectId.requests.tsx
  organizations.$id.projects.$projectId.documents.tsx
  organizations.$id.projects.$projectId.discussions.tsx
  organizations.$id.projects.$projectId.meetings.tsx
  organizations.$id.projects.$projectId.activity.tsx
  organizations.$id.projects.$projectId.permissions.tsx
```

## Data layer (local, no DB)

New `src/seed/projects.ts` + `src/lib/use-projects.ts` (mirrors `use-feed.ts` pattern with `useSyncExternalStore` + module cache to avoid render loops).

Types:
- `Project`: id, orgId (owner), name, description, objectives[], status (Planning/Active/On Hold/Completed), startDate, endDate, progress, image, tags[], industry, country, partners[], updatedAt
- `Partner`: orgId, name, logo, orgType (Brand/Manufacturer/Supplier/NGO/Auditor/Certifier/Recycler/Tech/Investor/Consultant/Logistics/Government/Research), country, role, status (Invited/Active/Left), permissions
- `Request`: id, title, description, assignedOrgId, requestedByOrgId, priority, dueDate, status, attachments[], comments[]
- `ProjectDoc`: id, folder, name, uploadedByOrgId, uploadedAt, version, visibility (All/Owner/Custom), dataUrl or url, size, mime
- `Discussion`: threaded messages with mentions (@OrgName), reactions, attachments
- `Meeting`: title, date, time, participants[], link, agenda, notes, attachments, actionItems[]
- `ActivityEvent`: type, actorOrgId, message, at
- `Permission` matrix per partner: view/upload/edit/approve/invite/create-requests/comment/download

Seed 2–3 sample projects per org with realistic partners (pulled from `ALL_ENTITIES`), a mix of requests, documents, meetings, and activity entries.

## UI Components

New under `src/components/projects/`:
- `ProjectsIndex.tsx` — grid of project cards (image, status pill, progress bar, partner count, tags, last updated), "Create Project" dialog
- `ProjectShell.tsx` — inner left sidebar (Overview, Partners, Requests, Shared Documents, Discussions, Meetings, Activity Timeline, Permissions) + header with project name, status, progress, quick actions
- `ProjectOverview.tsx` — stats tiles, timeline, recent activity, important docs, upcoming meetings, quick action buttons (Create Request, Invite Partner, Upload Document, Schedule Meeting)
- `PartnersPanel.tsx` — partner cards (logo, name, type, country, role, status; View Profile / Message / Contact); Invite Partner dialog (pick from `ALL_ENTITIES`)
- `RequestsPanel.tsx` — list + filters by status/priority; request detail drawer with comments thread and attachments; Create Request dialog
- `DocumentsPanel.tsx` — folder sidebar (Certificates, Contracts, Design Files, Audit Reports, Images, Videos, Invoices, Reports); table of docs with search, upload (FileReader dataURL, ≤3.5MB like feed), preview (images inline, video controls, doc download), version bump, comments
- `DiscussionsPanel.tsx` — threaded conversations, @org mentions autocomplete, reactions, attachments, search
- `MeetingsPanel.tsx` — upcoming/past tabs, meeting cards, create/edit dialog, action items checklist
- `ActivityTimeline.tsx` — chronological event feed grouped by day
- `PermissionsPanel.tsx` — matrix table (partners × permissions) with toggles; only owner org can edit
- `GlobalProjectSearch.tsx` — command-palette-style search across partners/requests/docs/comments/meetings inside a project

## Design

- Match existing shadcn tokens (rounded-xl cards, muted borders, subtle shadows) — Linear/Notion/Slack-inspired
- Whitespace-forward, single accent color, no gradients
- Status pills, priority chips, progress bars use semantic tokens from `styles.css`
- Responsive: inner sidebar collapses to icon rail on small screens

## Out of scope

- No backend/Supabase changes, no realtime, no notifications delivery system (activity entries only)
- No Kanban/Gantt/sprint constructs
- Existing org sidebar and other sections unchanged
- Cross-project search stays inside a project (as spec says)

## Technical notes

- Persist under `gch.projects.v1` in localStorage; per-org scoping via `orgId` filter
- Owner-only actions gated in UI by comparing viewer `orgId` to `project.orgId`
- File uploads: dataURL with size cap; show warning above cap
- All navigation via TanStack `<Link>` with typed params; new route strings match filenames exactly
- No changes to `research.functions.ts`, feed, messages, meetings routes
