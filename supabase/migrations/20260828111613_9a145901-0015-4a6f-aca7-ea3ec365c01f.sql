REVOKE EXECUTE ON FUNCTION public.orgs_are_connected(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.orgs_are_connected(uuid, uuid) TO authenticated, service_role;