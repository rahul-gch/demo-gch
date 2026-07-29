GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_org_role(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_is_owner(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_can_edit(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_can_manage(uuid, uuid) TO authenticated, anon;