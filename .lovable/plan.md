# Show only organization names in Messages

Right now each incoming bubble is labelled with the organization plus the individual person who typed it ("xyz via projectmate57", "xyz via Rahul Bedjavalge"). Messages are org-to-org, so the person name should not appear.

## Changes

1. **Message bubbles** (`src/components/messages/MessageList.tsx`)
   - Drop the "via {authorName}" suffix; the sender label shows only the organization name.
   - Keep grouping/avatar logic as-is so consecutive messages from the same org still collapse.

2. **New-message toast** (`src/lib/use-comms.ts`)
   - The realtime toast currently reads "New message from {author_name}" (a person). Change it to the sending organization's name, falling back to "a partner".

3. **Notification bell** (`src/lib/notifications.functions.ts`)
   - Already prefers the org name but falls back to `author_name`; change the fallback to a neutral "Partner organization" so no personal name leaks.

## End-to-end check of the message flow

- Sending still stores `author_name` in the database (useful for audit/logging) — only the UI stops surfacing it.
- Verify: send a message from one org, confirm the recipient sees the org name only in the thread, conversation list preview, toast, and notification bell.

## Not changing

Navigation, thread layout, composer, read state, or RLS/permissions.
