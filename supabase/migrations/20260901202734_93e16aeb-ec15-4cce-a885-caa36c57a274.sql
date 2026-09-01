CREATE OR REPLACE FUNCTION public.user_can_manage(_user uuid, _org uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.is_platform_admin(_user)
      or public.user_org_role(_user, _org) in ('owner', 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.user_can_edit(_user uuid, _org uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.is_platform_admin(_user)
      or public.user_org_role(_user, _org) in ('owner', 'admin', 'editor')
$function$;