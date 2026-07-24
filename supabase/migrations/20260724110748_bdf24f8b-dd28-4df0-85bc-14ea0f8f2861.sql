
-- 1. Invites table
CREATE TABLE public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  email text,
  role public.org_role NOT NULL DEFAULT 'viewer',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  max_uses int NOT NULL DEFAULT 1,
  uses int NOT NULL DEFAULT 0,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_invites TO authenticated;
GRANT ALL ON public.org_invites TO service_role;

-- 3. RLS
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites readable by org managers"
  ON public.org_invites FOR SELECT
  TO authenticated
  USING (public.user_can_manage(auth.uid(), org_id));

CREATE POLICY "invites insert by org managers"
  ON public.org_invites FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can_manage(auth.uid(), org_id) AND invited_by = auth.uid());

CREATE POLICY "invites update by org managers"
  ON public.org_invites FOR UPDATE
  TO authenticated
  USING (public.user_can_manage(auth.uid(), org_id));

CREATE POLICY "invites delete by org managers"
  ON public.org_invites FOR DELETE
  TO authenticated
  USING (public.user_can_manage(auth.uid(), org_id));

-- 4. updated_at trigger
CREATE TRIGGER trg_org_invites_updated_at
  BEFORE UPDATE ON public.org_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX org_invites_token_idx ON public.org_invites(token);
CREATE INDEX org_invites_org_idx ON public.org_invites(org_id);

-- 5. Public lookup RPC (unauthenticated visitors can see who invited them)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS TABLE (
  org_id uuid,
  org_name text,
  role public.org_role,
  is_email_locked boolean,
  invited_email text,
  expires_at timestamptz,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    i.role,
    (i.email IS NOT NULL) AS is_email_locked,
    i.email,
    i.expires_at,
    CASE
      WHEN i.revoked_at IS NOT NULL THEN 'revoked'
      WHEN i.expires_at < now() THEN 'expired'
      WHEN i.uses >= i.max_uses THEN 'used'
      ELSE 'active'
    END AS status
  FROM public.org_invites i
  JOIN public.orgs o ON o.id = i.org_id
  WHERE i.token = _token
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon, authenticated;

-- 6. Accept invite RPC
CREATE OR REPLACE FUNCTION public.accept_invite(_token text, _display_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.org_invites%ROWTYPE;
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_display text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.org_invites WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF v_invite.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invite_revoked'; END IF;
  IF v_invite.expires_at < now() THEN RAISE EXCEPTION 'invite_expired'; END IF;
  IF v_invite.uses >= v_invite.max_uses THEN RAISE EXCEPTION 'invite_used_up'; END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF v_invite.email IS NOT NULL AND lower(v_invite.email) <> lower(coalesce(v_user_email, '')) THEN
    RAISE EXCEPTION 'invite_email_mismatch';
  END IF;

  v_display := coalesce(nullif(trim(_display_name), ''), split_part(coalesce(v_user_email, 'Member'), '@', 1));

  INSERT INTO public.org_members (org_id, user_id, display_name, role, invited_by)
  VALUES (v_invite.org_id, v_user_id, v_display, v_invite.role, v_invite.invited_by)
  ON CONFLICT (org_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;

  UPDATE public.org_invites
    SET uses = uses + 1,
        accepted_at = CASE WHEN uses + 1 >= max_uses THEN now() ELSE accepted_at END
    WHERE id = v_invite.id;

  RETURN v_invite.org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invite(text, text) TO authenticated;

-- 7. Ensure org_members has unique(org_id, user_id) for the upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'org_members_org_user_unique'
  ) THEN
    ALTER TABLE public.org_members
      ADD CONSTRAINT org_members_org_user_unique UNIQUE (org_id, user_id);
  END IF;
END $$;
