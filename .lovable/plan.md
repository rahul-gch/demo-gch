## Phase 3 — Projects + requests on the backend

Goal: replace the browser-local project store (`src/lib/use-projects.ts` writing `gch.projects.v1` in localStorage, seeded from `src/seed/projects.ts`) with real shared data, so a project created by one organization is actually visible to its invited partners, and requests/discussions/documents/meetings inside a project are real cross-org records.

The UI stays as it is — projects index, project shell with its tabs (Overview, Partners, Requests, Documents, Discussions, Meetings, Permissions, Activity) all keep their current layout. Only the data underneath changes.

### What becomes real

**Projects**
- A project belongs to an owner organization and has a set of partner organizations, each with a role, status (Invited / Active / Left) and a permission set (view, upload, edit, approve, invite, create requests, comment, download).
- Creating a project, inviting a partner, and toggling a permission all write to the database and are visible to every partner of that project.
- A project appears on an org's Projects page if that org owns it **or** is a partner on it — so an invited manufacturer sees the brand's project in their own workspace.

**Requests**
- A request records who raised it, which organization it is assigned to, title, description, priority, due date, status, attachments and threaded comments.
- Status changes and comments are shared: the assigned org sees the request in their project tab and can move it forward.
- The currently empty `/organizations/$id/requests` page ("Coming soon") becomes a real cross-project inbox: all requests assigned to this org (inbound) and all requests it raised (outbound), each linking into its project.

**Discussions, documents, meetings, activity**
- Discussion threads and replies become shared rows with reactions.
- Project documents record folder, uploader org, version, visibility and (where a file is attached) a stored file in the existing private `org-docs` bucket, downloaded through short-lived signed URLs.
- Project meetings, their agenda/notes and action items become shared; ticking an action item is visible to all partners.
- The activity feed is generated from real events rather than a local array.

**Access rules**
- Only members of the owner org or of a partner org can read a project and anything inside it.
- Write actions are checked against that partner's permission flags — e.g. only a partner with "create requests" can raise one, only "approve" can complete one, only "invite" can add a partner.
- Author identity (org + person name) always comes from the signed-in session, never from the form.

### Demo continuity

Today every org gets deterministic demo projects generated in code on first visit, so the page never looks empty. Phase 3 does a one-time import that writes a realistic set of projects — with partners, requests, discussions, documents and meetings between imported organizations — into the database, so Projects still looks populated on first load. After that, everything shown is real.

### Technical notes

- New tables: `projects`, `project_partners` (org-scoped, with the permission flags), `project_requests`, `request_comments`, `project_documents`, `project_discussions`, `discussion_replies`, `project_meetings`, `meeting_action_items`, `project_activity`. Each with grants, RLS scoped through a new `is_project_partner(_user, _project)` security-definer helper plus a `project_permission(_user, _project, _key)` check, and `updated_at` triggers.
- Access goes through `createServerFn` in `src/lib/projects.functions.ts` (+ `projects.server.ts` for helpers and row→DTO mapping) using `requireSupabaseAuth`, wired through TanStack Query with loader prefetching; `src/lib/use-projects.ts` becomes query/mutation hooks with the same call signatures where possible so `panels.tsx` and `ProjectsIndex.tsx` need only mechanical edits.
- Document uploads go to `org-docs` under a `projects/<projectId>/` prefix with RLS on `storage.objects` restricted to project partners.
- `src/seed/projects.ts` is deleted once `ProjectsIndex.tsx`, `ProjectShell.tsx`, `panels.tsx`, the eight project routes and `/organizations/$id/requests` are switched over; the shared TypeScript types move to `src/lib/projects-types.ts`.

### Delivery

One round: tables + import, server functions, then the projects UI and the new requests inbox switched over, verified end-to-end in the browser (create a project, invite a partner, raise a request from one org and act on it from the other). Phase 4 (feed + notifications) follows.
