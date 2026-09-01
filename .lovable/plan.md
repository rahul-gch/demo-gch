# Fix message attribution and make connection requests actually work

Two separate problems, both confirmed by inspecting the code and the live database.

## 1. Threads show a person's name instead of the organization

Messages are stored with the *individual member* who typed them (`author_name` /
`author_role`), and the thread renders that string above each incoming bubble. In the
screenshots, "Rahul Bedjavalge admin" and "projectmate57 editor / viewer" are simply the
member rows of the sending organisation — the same two people belong to both workspaces,
so it reads as if the wrong company is talking.

Messaging on this platform is organisation-to-organisation, so the thread should be
attributed to the organisation first.

Changes:
- Above an incoming bubble, show the counterpart **organisation name** as the primary
  label, with the member name as a small secondary detail (e.g. "xyz · via Rahul B.").
- Drop the internal role word (admin / editor / viewer) from the thread entirely — it is
  an internal permission of the other company and should not leak into the conversation.
- Own messages stay unlabeled, as today.

No database change is needed; existing rows keep their member name for the secondary line.

## 2. Connect request / accept workflow does not persist

The connection server functions read and write a table called `org_connections`. That
table **does not exist** in the database (verified). Every call silently falls into an
in-memory `Map` fallback, which lives inside a stateless server worker — so a sent request
disappears on the next request or deploy, and the other organisation never sees it.

The same functions also run unauthenticated and use the service-role key, meaning anyone
could create or accept a connection between any two organisations.

Changes:
- Create `org_connections` (from/to organisation, status pending / accepted / declined,
  timestamps, unique pair) with row-level security and grants: a user can see rows where
  they are a member of either side, create a request only for an organisation they belong
  to, and accept or decline only requests addressed to their organisation.
- Rewrite the connection server functions to run as the signed-in user (auth middleware),
  store real organisation UUIDs, and delete the in-memory `Map` and service-role client.
- Keep the existing legacy-id / slug mapping so profile pages and matchmaking keep working,
  but resolve to UUIDs before touching the database.
- Keep the client hooks and UI unchanged in shape; only the id passed for connection
  mutations moves to the organisation UUID.

## Technical notes

- Files: `src/lib/connections.functions.ts` (rewrite), `src/lib/org-connections.ts` (id
  resolution), `src/components/messages/MessageList.tsx` and
  `src/lib/use-comms.ts` (thread label), plus one migration for `org_connections`.
- Migration order: CREATE TABLE, GRANT to authenticated/service_role, ENABLE RLS, policies.
- After the change, existing showroom visibility (`orgs_are_connected`) can additionally
  consider accepted rows in `org_connections`.

## Verification

- Send a request from one organisation, sign in as the other, confirm it appears as an
  inbound request, accept it, and confirm both sides show "Connected" after a reload.
- Open a thread between two organisations and confirm the incoming bubbles are labelled
  with the other company's name.
