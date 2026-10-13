ALTER TABLE public.org_credentials ADD COLUMN IF NOT EXISTS reviewed_by uuid, ADD COLUMN IF NOT EXISTS reviewed_at timestamptz, ADD COLUMN IF NOT EXISTS review_note text, ADD COLUMN IF NOT EXISTS document_name text;

CREATE POLICY "cred admin update" ON public.org_credentials FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "orgverif admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'org-verification' AND public.is_platform_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.sync_verified_credentials()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _org uuid; _std text;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.status = 'verified' THEN
    UPDATE public.orgs SET certifications = array_append(certifications, NEW.standard)
     WHERE id = NEW.org_id AND NOT (NEW.standard = ANY(certifications));
  END IF;
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'verified' AND (NEW.status <> 'verified' OR NEW.standard <> OLD.standard)) THEN
    _org := OLD.org_id; _std := OLD.standard;
    IF NOT EXISTS (SELECT 1 FROM public.org_credentials WHERE org_id = _org AND standard = _std AND status = 'verified' AND id <> OLD.id) THEN
      UPDATE public.orgs SET certifications = array_remove(certifications, _std) WHERE id = _org;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_verified_credentials() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER org_credentials_sync_certs AFTER INSERT OR UPDATE OR DELETE ON public.org_credentials
  FOR EACH ROW EXECUTE FUNCTION public.sync_verified_credentials();