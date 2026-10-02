---
name: supabase-bola-security
description: >
  Audits, detects, and prevents fullstack authorization vulnerabilities (BOLA/IDOR),
  GDPR column leaks, Supabase RLS regressions, unauthenticated server functions,
  actor/sender spoofing, and in-memory multi-tenant state leaks. Use whenever reviewing,
  auditing, writing, or refactoring fullstack server functions, database migrations,
  Supabase RLS policies, access controls, or security reviews.
license: MIT
---

# Supabase & Fullstack BOLA Security Audit Guide

This skill guides you through auditing, identifying, and remediating high-impact fullstack security vulnerabilities—specifically Broken Object-Level Authorization (BOLA), Supabase Row-Level Security (RLS) leaks, GDPR column exposures, and server-side authorization bypasses.

---

## The 5 Archetypes of Fullstack & Supabase Vulnerabilities

### 1. 🔴 The "Open Contact Book" (GDPR Column Leak via Broad Grants)
* **The Root Cause**: Running `GRANT SELECT ON public.<table> TO authenticated;` after previous migrations established column-level security. This unintentionally grants access to sensitive private columns (`contacts`, `profile_answers`, `governance`, `traceability_notes`, `comments`).
* **The Vulnerability**: Any logged-in user can query the Supabase REST API (`/rest/v1/orgs?select=contacts,profile_answers`) and dump competitor phone numbers, direct emails, and confidential questionnaires.
* **The Rule**:
  - **Never** grant table-wide `SELECT` on tables holding mixed public and private data.
  - **Always** revoke broad `SELECT` and grant only explicit non-sensitive columns.
  - **Reconcile live schema**: Before running `GRANT SELECT (col1, col2...)`, inspect the table schema for newly added columns (e.g. `operating_countries`, `is_hidden`) so directory UI does not break.
  - **Expose private data exclusively via RPC**: Keep private columns accessible only through `SECURITY DEFINER` functions with `SET search_path = public` that verify caller membership or accepted partner status.

---

### 2. 🔴 The "Self-Accepted Connection" (Bi-Directional Policy Loophole)
* **The Root Cause**: Relational handshake tables (e.g. `org_connections`, `invites`, `partnerships`) having an `UPDATE` policy that checks `from_id OR to_id`.
* **The Vulnerability**: The sender creates a connection request, and then immediately sends an API update marking it as `accepted` without recipient approval, unlocking the victim's private showroom, certificates, and documents.
* **The Rule**:
  - The sender (`from_id`) must **only** have `INSERT` and `DELETE` (withdrawal) permissions.
  - The recipient (`to_id`) must be the **only** party with `UPDATE` permission to change status to `accepted` or `declined`.
  - Pattern:
    ```sql
    CREATE POLICY "Recipient org decides on the connection"
      ON public.org_connections FOR UPDATE TO authenticated
      USING (public.is_org_member(auth.uid(), to_org_id) OR public.is_platform_admin(auth.uid()))
      WITH CHECK (public.is_org_member(auth.uid(), to_org_id) OR public.is_platform_admin(auth.uid()));
    ```

---

### 3. 🟠 Broken Object-Level Authorization (BOLA) in Server Functions
* **The Root Cause**: In server actions/mutations (e.g. `projects.functions.ts`), code verifies:
  1. Is the user logged in? (`requireSupabaseAuth`) -> Yes.
  2. Does the user belong to their own company? (`assertOrgRole(userId, actorOrgId)`) -> Yes.
  **BUT forgets to check**: Does `actorOrgId` actually own or participate in the target object (`projectId`)?
* **The Vulnerability**: A user from Company A passes the ID of Company B's confidential project to upload documents, add comments, approve requests, or change permissions.
* **The Rule**:
  - Implement an `assertProjectAccess` (or `assertObjectAccess`) helper and call it at the top of **every mutation**:
    ```typescript
    export async function assertProjectAccess(
      supabase: any,
      userId: string,
      projectId: string,
      actorOrgId: string,
      minRole: "viewer" | "editor" | "admin" = "editor"
    ) {
      const actorUuid = (await resolveOrgRow(supabase, actorOrgId))?.id ?? actorOrgId;
      await assertOrgRole(supabase, userId, actorUuid, minRole);

      const { data: project } = await supabase
        .from("projects")
        .select("id, owner_org_id")
        .eq("id", projectId)
        .maybeSingle();
      if (!project) throw new Error("Project not found");

      if (project.owner_org_id === actorUuid) return { project, actorUuid, isOwner: true };

      const { data: partner } = await supabase
        .from("project_partners")
        .select("id, permissions")
        .eq("project_id", projectId)
        .eq("org_id", actorUuid)
        .maybeSingle();

      if (!partner) throw new Error("Forbidden: your organization is not part of this project.");
      return { project, actorUuid, isOwner: false, partner };
    }
    ```

---

### 4. 🟠 The "Optional Parameter" & Impersonation Bypasses
* **The Root Cause**:
  - Making parameters like `actingOrgId` optional (`z.string().uuid().optional()`), where omission bypasses recipient validation checks.
  - Inserting records using caller-supplied `requesterOrgId` or `orgId` without verifying the caller actually belongs to that organization.
* **The Vulnerability**:
  - Omitting `actingOrgId` allows anyone to accept/decline meetings or change statuses across the platform.
  - Supplying a victim's `requesterOrgId` lets an attacker schedule meetings or publish feed posts impersonating other brands.
* **The Rule**:
  - **Never** make tenant context (`actingOrgId`, `requesterOrgId`) optional if authorization checks depend on it.
  - **Always** verify caller membership via `is_org_member(userId, targetOrgId)` before inserting or modifying records under that organization.
  - For deletion (e.g. `deleteFeedPost`), verify the caller is either the original author (`author_user_id === userId`), an organization manager (`user_can_manage`), or a platform admin.

---

### 5. 🔴 The "In-Memory Store" & Missing Auth Middleware
* **The Root Cause**: Server function files using `const memoryStore = new Map()` in server RAM and querying Supabase via an unauthenticated anonymous client without `.middleware([requireSupabaseAuth])`.
* **The Vulnerability**: Anyone on the internet can call the endpoint without logging in. Data is stored in unmanaged process RAM outside database RLS, risking cross-tenant data mixing and data loss on server restart.
* **The Rule**:
  - Delete all `new Map()` or in-memory stores for multi-tenant state.
  - Require authentication middleware on all server functions: `.middleware([requireSupabaseAuth])`.
  - Always use the session-bound client (`context.supabase`) or authenticated RPCs.
  - Persist directly to the database via access-checked helpers (`readProfileAnswers`, `writeProfileAnswers`).

---

## Step-by-Step Security Audit Checklist

When reviewing fullstack code or preparing for security audits:

1. **Database Migrations Check**:
   - [ ] Did any recent migration run `GRANT SELECT ON <table> TO authenticated`? If so, verify whether that table contains private columns.
   - [ ] Are all `SECURITY DEFINER` functions configured with `SET search_path = public`?
   - [ ] Do handshake/request tables (`org_connections`) restrict `UPDATE` policies exclusively to the recipient?
2. **Server Functions Check**:
   - [ ] Does every `createServerFn` have `.middleware([requireSupabaseAuth])`?
   - [ ] Are any global `new Map()` or in-memory caches holding user/tenant data? (Delete them).
   - [ ] Does every mutation verify **Object-Level Authorization** (does caller's org belong to the target project/meeting/thread)?
   - [ ] Are all acting org IDs strictly required in input validators?
   - [ ] Does every insert/post verify that the caller is a member of the requesting org?
3. **Verification Testing Protocol**:
   - Test unauthorized read: `fetch('/rest/v1/<table>?select=sensitive_col')` must return `403 Forbidden`.
   - Test public read: `fetch('/rest/v1/<table>?select=public_cols')` must return `200 OK`.
   - Test cross-tenant mutation: Attempting to update another company's project/meeting must return `Forbidden`.
