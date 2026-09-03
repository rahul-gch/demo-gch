# Fix "CancelledError" on new-tab open and add post deletion in the feed

## 1. "This page didn't load — CancelledError" when opening the app in a new tab

### What is happening
When you open `https://app.globalchainhub.io/` in a fresh tab, two things run at the same time:

- The route guard (`/_authenticated` and the home redirect) starts loading the organization registry and your memberships.
- The login session finishes restoring in the background and fires an "initial session" event. The handler for that event invalidates/removes exactly those cached queries (`entities/registry`, `my-org-memberships-gate`, `am-i-platform-admin`).

Invalidating a query that is still loading cancels the in-flight request, so the guard's `await` rejects with `CancelledError` and the error page appears. In an already-open tab the session is long restored, so the race never happens — which is why it only shows up in new tabs. "Go home" simply reloads `/`, which then redirects to your organization dashboard as designed.

### Fix
- `src/routes/__root.tsx` — the initial-session handler must not cancel in-flight loads: use `invalidateQueries({ ..., cancelRefetch: false })` for the registry and for the two gate queries instead of `removeQueries`. Client-side requests already carry the login token (the token attacher waits for session restore), so the in-flight answers are valid and do not need to be discarded.
- `src/lib/registry.ts` — `refreshRegistry` uses `fetchQuery`; add a small guard so a `CancelledError` retries once instead of failing the navigation.
- `src/routes/_authenticated.tsx` and `src/routes/_authenticated.index.tsx` — wrap the gate lookups with the same retry-on-cancel helper so a cancellation never becomes a broken page.
- `src/components/RouteErrorFallback.tsx` — if the error is a `CancelledError`, automatically reload once instead of showing the error card (safety net).

## 2. Delete your own posts in the feed

Deletion already exists server-side (`deleteFeedPost`, database rule: author or org owner/admin may delete) and in the hook (`useFeedActions().deletePost`), but no button calls it.

### Fix
- `src/lib/feed.functions.ts` / `src/lib/feed-types.ts` — return `authorUserId` on each post so the UI knows who wrote it.
- `src/components/feed/FeedWorkspace.tsx` (organization feed) and `src/components/feed/CommunityFeed.tsx` (community feed) — add a small "..." menu in the top-right of each post card with **Delete post**. It is shown when the signed-in user is the author, or is an owner/admin of the posting organization. Deleting asks for confirmation and removes the post (likes and comments are removed with it). The list refreshes immediately via the existing live subscription.

## Verification
- Open the app in a new tab while signed in — lands on the organization dashboard with no error card; repeat several times.
- Post in the org feed and in the community feed, delete each via the "..." menu; the post disappears, and a member who did not write the post does not see the option.
- Typecheck and build pass.
