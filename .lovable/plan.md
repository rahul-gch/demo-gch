
## Goal

Each persona's organisation gets a real **Org Profile** page with:
- a member list (current user + seeded teammates) and their roles
- editable org settings (name, description, country, certifications, contacts)
- a document library (Certifications · Evidence files · Org documents)
- role-based access control: only Owners/Admins can manage members and settings; Editors can edit profile + upload docs; Viewers are read-only

All persisted in Lovable Cloud (Postgres + Storage), gated by RLS. The existing localStorage demo personas keep working for sign-in, but org data + docs live in the real backend.

A new section is added to `/how-it-works` explaining org membership, the role matrix, and the document model in plain language.

---

## 1. Backend (Lovable Cloud)

### Tables (all under `public`, RLS on, GRANTs to authenticated + service_role)

```text
orgs
  id uuid pk
  slug text unique           -- "acme", "northwind", "gch-verify"
  name text, type text, country text, region text, size text, tier text
  description text, website text
  certifications text[]      -- ["ISO 9001", "GOTS"]
  created_at, updated_at

org_members
  id uuid pk
  org_id uuid fk orgs
  user_id uuid fk auth.users
  role org_role              -- enum: owner | admin | editor | viewer
  invited_by uuid, joined_at
  unique(org_id, user_id)

org_documents
  id uuid pk
  org_id uuid fk orgs
  uploaded_by uuid fk auth.users
  category doc_category       -- enum: certification | evidence | org_document
  title text, description text
  storage_path text            -- "org-docs/{org_id}/{uuid}-{filename}"
  mime_type text, size_bytes int
  created_at
```

### Enums
- `org_role`: `owner`, `admin`, `editor`, `viewer`
- `doc_category`: `certification`, `evidence`, `org_document`

### Security-definer helpers (avoid RLS recursion)
- `public.user_org_role(_user uuid, _org uuid) returns org_role`
- `public.user_can_manage(_user, _org) returns bool` (owner|admin)
- `public.user_can_edit(_user, _org) returns bool` (owner|admin|editor)
- `public.is_org_member(_user, _org) returns bool`

### RLS policies (summary, in plain English)
- **orgs**: any authenticated user can read all orgs (ecosystem is shared); only Owners/Admins of that org can update it; only service_role can insert/delete.
- **org_members**: members can see their org's roster; only Owners/Admins can insert/update/delete members; Owner role can only be assigned by another Owner.
- **org_documents**: members can list/read their org's docs; Editors+ can insert; uploader OR Owner/Admin can delete; everyone authenticated can read `category=certification` docs of any org (for ecosystem transparency).

### Storage
- Bucket `org-docs` (private). Storage policies:
  - read: members of the org (path prefix = `{org_id}/...`) **or** doc is a certification
  - write: Editors+ of the org
  - delete: uploader or Owner/Admin

---

## 2. Auth + seeding

- Replace the localStorage demo with real email/password sign-in (keep the 4 demo accounts: rahul@…, george@…, maria@…, admin@…). Google OAuth added via the broker.
- One-time seed (server function, idempotent): create orgs for Acme, Northwind, GCH Verification; create each persona's auth user if missing; insert as `owner`; add 2 seeded teammate `org_members` per org (using placeholder profile rows — no real auth users needed for them, so we add a `profiles` table with `display_name`, `title`, `avatar_url`, `user_id nullable`, and a `member_profile_id` column on `org_members` for non-auth seeded teammates).

  Simpler alternative we'll go with: keep `org_members.user_id` nullable and add `display_name`, `title` directly on `org_members` for seeded ghosts. Real users have `user_id` set; demo teammates don't.

---

## 3. Server functions (`createServerFn`, all under `src/lib/org.functions.ts`)

- `getMyOrg()` → org + members + role of current user
- `getOrg(slug)` → public org view (no docs)
- `updateOrg(input)` → gated by `user_can_edit`
- `listMembers(orgId)` / `inviteMember({email, role})` / `updateMemberRole` / `removeMember` — gated by `user_can_manage`
- `listDocuments(orgId, category?)` → gated by membership (or certification public)
- `createDocument({orgId, category, title, file})` → Editors+, returns signed upload URL or uses `storage_upload`
- `deleteDocument(id)` → uploader or Admin

All protected with `requireSupabaseAuth`. `attachSupabaseAuth` is already wired in `src/start.ts`.

---

## 4. Frontend

### New route: `/org/$slug` (also linked from header avatar → "My Organisation")
Tabs:
1. **Overview** — name, description, country, tier, certifications, website. Edit button visible to Editors+.
2. **Members** — table of `{avatar, name, title, role}`. Owners/Admins see Invite + role-change dropdown + remove.
3. **Documents** — sub-tabs Certifications / Evidence / Org documents. Upload button visible to Editors+. Each row: title, uploaded by, date, download, delete (conditional).
4. **Settings** — only Owners. Org slug, danger zone (transfer ownership, delete org).

### Permission UI helpers
- `useOrgRole(orgId)` hook → returns `{role, canManage, canEdit}`.
- Buttons rendered via `<RoleGate need="edit">…</RoleGate>` so disabled/hidden states are consistent.

### Wiring into existing screens
- `UserDashboard` header: show user's org name + role badge, link "Open org profile".
- Admin dashboard: list all orgs with member counts, link into `/org/$slug`.

---

## 5. How-it-works page additions

Add a new `Section` (between Personas and Graph) titled **"Organisations, members & access"** that explains:

- One organisation per persona; each org has multiple members. Diagram:
  ```text
  Acme Apparel
    ├─ Rahul        Owner
    ├─ Priya        Admin
    └─ Sam          Editor
  ```
- The 4-role matrix as a small table:

  | Capability                | Owner | Admin | Editor | Viewer |
  | ------------------------- | :---: | :---: | :----: | :----: |
  | View org + docs           |   ✓   |   ✓   |   ✓    |   ✓    |
  | Edit org profile          |   ✓   |   ✓   |   ✓    |        |
  | Upload / delete own docs  |   ✓   |   ✓   |   ✓    |        |
  | Invite / remove members   |   ✓   |   ✓   |        |        |
  | Change roles              |   ✓   |   ✓*  |        |        |
  | Transfer ownership, delete org |  ✓ |     |        |        |

  *Admins can't promote anyone to Owner.

- Document model: three categories (Certifications are visible across the ecosystem for trust; Evidence + Org documents are members-only).
- Where the data lives: Postgres tables `orgs`, `org_members`, `org_documents` + private `org-docs` storage bucket, all guarded by RLS so a Northwind viewer can never read Acme's internal docs.
- Why roles matter for matchmaking: certification docs feed the `Certifications` matchmaking factor; missing evidence raises the risk meter shown in dashboards.

Also extend the existing **Personas** section to show each persona's default role inside their org (all Owners in the seed).

---

## 6. Technical sections (for reviewers)

- Migration file order: enums → tables → GRANTs → RLS enable → security-definer functions → policies → storage bucket + policies → seed function.
- All policies use the `public.user_can_*` helpers to avoid the classic "infinite recursion in policy" error.
- Seeding runs once via an idempotent server function callable by `admin` only, triggered from a one-click button on the admin dashboard ("Seed demo orgs").
- File uploads use `supabase.storage.from('org-docs').upload(...)` on the client (RLS-checked), then insert the `org_documents` row via a server fn so we can validate size/mime.
- Max upload 10 MB, allowed mime: pdf, png, jpeg, csv, xlsx.

---

## Out of scope (for now)

- Real email invitations (we'll show "Invite link copied" toast and create a pending row).
- Audit log of who changed what.
- Versioning of documents.
- Editing the matchmaking algorithm to weigh new doc types differently.
