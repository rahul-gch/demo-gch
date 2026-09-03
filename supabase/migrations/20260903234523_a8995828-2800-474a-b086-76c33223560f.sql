REVOKE EXECUTE ON FUNCTION public.get_invite_by_token(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_platform_invite_by_token(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_invite_by_token(text) TO service_role;