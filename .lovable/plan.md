# Only admins can create organizations

Remove organization creation from the regular user experience. Everyone else joins an existing organization through an invite; platform admins remain the only people who can add new organizations.

## What changes for users

- The account menu loses the "Create new organization" item.
- The welcome screen after sign-up no longer offers a choice between create and join. It shows only the invite flow: paste the invite link or token an admin shared, with a short line explaining that organizations are added by the Global Chain Hub team.
- Platform admins keep the create form in the Admin > Organizations page, unchanged.

## Technical notes

- `src/components/UserMenu.tsx`: delete the "Create new organization" dropdown item (and the now-unused `Plus` import).
- `src/routes/welcome.tsx`: drop the two-card chooser and the `create` step; render `JoinWithInviteForm` directly with updated heading/help copy. `CreateOrgForm` is no longer imported here.
- `src/components/signup/CreateOrgForm.tsx` stays as-is, used only by `_authenticated.admin.organizations.tsx`.
- Server side: add a platform-admin check at the top of `createOrg` in `src/lib/orgs.functions.ts` (same `is_platform_admin` RPC pattern used in `admin.functions.ts`), so the endpoint cannot be called directly by non-admins.
- Database: tighten the `orgs` insert policy so only platform admins can insert, replacing the current authenticated-user insert rule. This requires a migration you'll be asked to approve.
- The `_authenticated` gate already sends members-less users to `/welcome`; that stays, they now land on the invite-only screen.

## Open point

Users with no invite currently reach a dead end at `/welcome`. I'll add a short "Contact us to get your organization added" note with a mailto link — tell me the address to use, otherwise I'll leave plain text.
