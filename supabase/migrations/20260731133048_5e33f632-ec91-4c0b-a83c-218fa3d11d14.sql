CREATE OR REPLACE FUNCTION public.platform_admin_domains()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT ARRAY['globalchainhub.io'] $$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user
      AND u.email_confirmed_at IS NOT NULL
      AND lower(split_part(u.email, '@', 2)) = ANY (public.platform_admin_domains())
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.platform_admin_domains() TO authenticated, anon;

CREATE TABLE public.platform_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  org_name text,
  target_org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'owner',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  note text,
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_invites TO authenticated;
GRANT ALL ON public.platform_invites TO service_role;

ALTER TABLE public.platform_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read platform invites" ON public.platform_invites
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins create platform invites" ON public.platform_invites
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins update platform invites" ON public.platform_invites
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER set_platform_invites_updated_at BEFORE UPDATE ON public.platform_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Platform admins manage orgs" ON public.orgs
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage members" ON public.org_members
  FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_platform_invite_by_token(_token text)
RETURNS TABLE(email text, org_name text, target_org_id uuid, target_org_name text, role org_role, expires_at timestamptz, status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT i.email, i.org_name, i.target_org_id, o.name, i.role, i.expires_at,
    CASE
      WHEN i.revoked_at IS NOT NULL THEN 'revoked'
      WHEN i.expires_at < now() THEN 'expired'
      WHEN i.uses >= i.max_uses THEN 'used'
      ELSE 'active'
    END
  FROM public.platform_invites i
  LEFT JOIN public.orgs o ON o.id = i.target_org_id
  WHERE i.token = _token
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_invite_by_token(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.accept_platform_invite(_token text, _display_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite public.platform_invites%ROWTYPE;
  v_user uuid := auth.uid();
  v_email text;
  v_display text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_invite FROM public.platform_invites WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found'; END IF;
  IF v_invite.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'invite_revoked'; END IF;
  IF v_invite.expires_at < now() THEN RAISE EXCEPTION 'invite_expired'; END IF;
  IF v_invite.uses >= v_invite.max_uses THEN RAISE EXCEPTION 'invite_used_up'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user;
  IF v_invite.email IS NOT NULL AND lower(v_invite.email) <> lower(coalesce(v_email, '')) THEN
    RAISE EXCEPTION 'invite_email_mismatch';
  END IF;

  IF v_invite.target_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_display := coalesce(nullif(trim(_display_name), ''), split_part(coalesce(v_email, 'Member'), '@', 1));

  INSERT INTO public.org_members (org_id, user_id, display_name, role, invited_by)
  VALUES (v_invite.target_org_id, v_user, v_display, v_invite.role, v_invite.invited_by)
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.platform_invites
    SET uses = uses + 1,
        accepted_at = CASE WHEN uses + 1 >= max_uses THEN now() ELSE accepted_at END
    WHERE id = v_invite.id;

  RETURN v_invite.target_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_platform_invite(text, text) TO authenticated;