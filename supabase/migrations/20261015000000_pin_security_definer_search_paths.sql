-- Pin search_path for elevated helpers so name resolution cannot be hijacked.
ALTER FUNCTION public.is_org_owner(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_can_view(uuid, uuid) SET search_path = public;
