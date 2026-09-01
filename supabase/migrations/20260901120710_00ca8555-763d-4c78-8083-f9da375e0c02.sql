CREATE TABLE public.org_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  to_org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid REFERENCES auth.users(id),
  responded_by uuid REFERENCES auth.users(id),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_connections_status_check CHECK (status IN ('pending','accepted','declined')),
  CONSTRAINT org_connections_distinct CHECK (from_org_id <> to_org_id),
  CONSTRAINT org_connections_pair_unique UNIQUE (from_org_id, to_org_id)
);

CREATE INDEX org_connections_from_idx ON public.org_connections (from_org_id);
CREATE INDEX org_connections_to_idx ON public.org_connections (to_org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_connections TO authenticated;
GRANT ALL ON public.org_connections TO service_role;

ALTER TABLE public.org_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members of either org can view connections"
  ON public.org_connections FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), from_org_id)
    OR public.is_org_member(auth.uid(), to_org_id)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Members can send a request from their own org"
  ON public.org_connections FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), from_org_id));

CREATE POLICY "Members of either org can update the connection"
  ON public.org_connections FOR UPDATE TO authenticated
  USING (
    public.is_org_member(auth.uid(), from_org_id)
    OR public.is_org_member(auth.uid(), to_org_id)
  )
  WITH CHECK (
    public.is_org_member(auth.uid(), from_org_id)
    OR public.is_org_member(auth.uid(), to_org_id)
  );

CREATE POLICY "Sender org can withdraw its request"
  ON public.org_connections FOR DELETE TO authenticated
  USING (public.is_org_member(auth.uid(), from_org_id));

CREATE TRIGGER org_connections_set_updated_at
  BEFORE UPDATE ON public.org_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
    )
    OR EXISTS (
      SELECT 1
      FROM public.conversation_participants pa
      JOIN public.conversation_participants pb
        ON pa.conversation_id = pb.conversation_id
      WHERE pa.org_id = _org_a AND pb.org_id = _org_b
    )
    OR EXISTS (
      SELECT 1 FROM public.project_partners pp
      JOIN public.projects p ON p.id = pp.project_id
      WHERE (pp.org_id = _org_a AND p.owner_org_id = _org_b)
         OR (pp.org_id = _org_b AND p.owner_org_id = _org_a)
    )
    OR EXISTS (
      SELECT 1 FROM public.project_partners p1
      JOIN public.project_partners p2 ON p1.project_id = p2.project_id
      WHERE p1.org_id = _org_a AND p2.org_id = _org_b
    );
$function$;