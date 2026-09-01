# Fix "C(...).validator is not a function"

## What's happening

Five server-side files still use the removed `.validator()` step when defining server functions. The current framework version renames it to `.inputValidator()`, so as soon as one of those modules loads, the app crashes with `C(...).validator is not a function`. Every other server file in the project already uses the new name, so this is leftover code that missed the rename.

## Affected areas

| File | Feature it breaks |
| --- | --- |
| `src/lib/connections.functions.ts` (3 spots) | Partner connections / requests |
| `src/lib/chain-storage.functions.ts` (3 spots) | Supply chain saved entities |
| `src/lib/research.functions.ts` (3 spots) | Research runs (save/list/delete) |
| `src/lib/match-preferences.functions.ts` (2 spots) | Matchmaking preferences |
| `src/lib/matchmaking-ai.functions.ts` (1 spot) | AI partner search |

## The fix

Rename `.validator(` to `.inputValidator(` at all 12 call sites. No logic, schema, or behaviour changes — validation rules stay exactly as they are.

## Verification

- Full-project search to confirm no `.validator(` remains on a server function chain.
- Typecheck.
- Load the app and exercise Matchmaking, Supply Chain, and Research pages to confirm no runtime error and data loads.
