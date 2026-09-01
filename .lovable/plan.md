# Why "xyz via projectmate57" appears, and how to fix the message flow

## What the data actually shows

In that thread (conversation `af6cbbe2…`) the messages are:

```text
11:05  xyz          — "hi hello"          by Rahul Bedjavalge
11:06  rahul gmbh   — "hi how are you ?"  by projectmate57
11:08  xyz          — "hi"                by projectmate57   <-- the circled one
11:09  rahul gmbh   — "hi"                by projectmate57
12:00  xyz          — "hi test msg"       by Rahul Bedjavalge
```

So the circled message really was stored with **xyz as the sending organization but projectmate57 as the sending user**. The database security rule on messages only allows that if the user was a member of that organization at the time — and the activity log shows `org.member_joined` for projectmate57 at 09:14 the same morning. Today `org_members` lists projectmate57 only under rahul gmbh, so that membership was later removed, leaving a message that looks like one company posting inside another's identity.

Two separate problems come out of this:

1. **Identity display** — the UI prints "org via person", which exposes individual account names and makes cross-org sends look like impersonation.
2. **Acting-organization handling** — when a user belongs to more than one organization, the thread will happily send as whichever organization the switcher last held, including the organization on the *other* side of the same conversation. Nothing warns the user or blocks it, and `sendMessage` performs no membership check of its own (it relies entirely on the database rule).

## Fix

1. **Show only the organization name** (`src/components/messages/MessageList.tsx`): drop the "via {person}" suffix. Same for the realtime toast in `src/lib/use-comms.ts` and the notification fallback in `src/lib/notifications.functions.ts`, which currently fall back to the person's name.

2. **Guard the sender server-side** (`src/lib/messaging.functions.ts` → `sendMessage`): before inserting, verify the signed-in user is a member of `myOrgId` via `is_org_member`, and reject with a clear "You are no longer a member of this organization" error instead of a raw database error.

3. **Block self-conversations from the wrong side**: reject when `myOrgId` equals the conversation's counterpart, and in the Messages page pin the acting organization to the inbox being viewed so switching organizations reloads that organization's own inbox rather than sending into the open thread under a new identity.

4. **Clean up the mislabelled history**: reassign the stray 11:08 message so its sending organization matches the user's actual organization (rahul gmbh), so the thread reads correctly for both sides.

## Verification

Sign in as each side of the thread and confirm: bubbles show only company names, own messages sit on the right for the correct company, sending as an organization you no longer belong to is refused, and the notification/toast text names the company.

## Not changing

Navigation, thread layout, composer behaviour, read receipts, or the existing security policies on `messages`.
