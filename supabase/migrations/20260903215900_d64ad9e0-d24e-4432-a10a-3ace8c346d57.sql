CREATE OR REPLACE FUNCTION public.orgs_are_connected(_org_a uuid, _org_b uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _org_a = _org_b
    OR EXISTS (
      SELECT 1 FROM public.org_connections c
      WHERE c.status = 'accepted'
        AND ((c.from_org_id = _org_a AND c.to_org_id = _org_b)
          OR (c.from_org_id = _org_b AND c.to_org_id = _org_a))
    );
$function$;