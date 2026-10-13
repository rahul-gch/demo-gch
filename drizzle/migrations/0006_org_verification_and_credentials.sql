CREATE TABLE public.org_verification (
  org_id uuid PRIMARY KEY REFERENCES public.orgs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_submitted' CHECK (status IN ('not_submitted','pending','verified','rejected')),
  document_path text,
  document_name text,
  submitted_by uuid,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.org_verification TO authenticated;
GRANT ALL ON public.org_verification TO service_role;
ALTER TABLE public.org_verification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif read" ON public.org_verification FOR SELECT TO authenticated
  USING (public.user_can_manage(auth.uid(), org_id));
CREATE POLICY "verif insert" ON public.org_verification FOR INSERT TO authenticated
  WITH CHECK (public.user_can_manage(auth.uid(), org_id) AND (status IN ('not_submitted','pending') OR public.is_platform_admin(auth.uid())));
CREATE POLICY "verif update" ON public.org_verification FOR UPDATE TO authenticated
  USING (public.user_can_manage(auth.uid(), org_id))
  WITH CHECK (public.user_can_manage(auth.uid(), org_id) AND (status IN ('not_submitted','pending') OR public.is_platform_admin(auth.uid())));
CREATE TRIGGER org_verification_updated_at BEFORE UPDATE ON public.org_verification
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.org_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('audit','certificate','membership')),
  standard text NOT NULL,
  reference text,
  scope text,
  score text,
  issued_at date,
  expires_at date,
  document_path text,
  status text NOT NULL DEFAULT 'self_declared' CHECK (status IN ('self_declared','verified','rejected')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX org_credentials_org_idx ON public.org_credentials(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_credentials TO authenticated;
GRANT ALL ON public.org_credentials TO service_role;
ALTER TABLE public.org_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cred read" ON public.org_credentials FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id) OR public.is_platform_admin(auth.uid()));
CREATE POLICY "cred insert" ON public.org_credentials FOR INSERT TO authenticated
  WITH CHECK (public.user_can_edit(auth.uid(), org_id) AND (status = 'self_declared' OR public.is_platform_admin(auth.uid())));
CREATE POLICY "cred update" ON public.org_credentials FOR UPDATE TO authenticated
  USING (public.user_can_edit(auth.uid(), org_id))
  WITH CHECK (public.user_can_edit(auth.uid(), org_id) AND (status = 'self_declared' OR public.is_platform_admin(auth.uid())));
CREATE POLICY "cred delete" ON public.org_credentials FOR DELETE TO authenticated
  USING (public.user_can_edit(auth.uid(), org_id));
CREATE TRIGGER org_credentials_updated_at BEFORE UPDATE ON public.org_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "orgverif read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'org-verification' AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "orgverif insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-verification' AND public.user_can_edit(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "orgverif delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'org-verification' AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid));