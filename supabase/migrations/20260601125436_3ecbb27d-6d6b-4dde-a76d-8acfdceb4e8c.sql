
-- search_path is already set in CREATE OR REPLACE above; explicitly re-assert for linter.
alter function public.set_updated_at() set search_path = public;

-- Revoke broad EXECUTE; only service_role + RLS policies (which run as definer) need these.
revoke execute on function public.user_org_role(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.is_org_member(uuid, uuid)  from public, anon, authenticated;
revoke execute on function public.user_can_edit(uuid, uuid)  from public, anon, authenticated;
revoke execute on function public.user_can_manage(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.user_is_owner(uuid, uuid)  from public, anon, authenticated;

grant execute on function public.user_org_role(uuid, uuid)   to service_role;
grant execute on function public.is_org_member(uuid, uuid)   to service_role;
grant execute on function public.user_can_edit(uuid, uuid)   to service_role;
grant execute on function public.user_can_manage(uuid, uuid) to service_role;
grant execute on function public.user_is_owner(uuid, uuid)   to service_role;
