CREATE OR REPLACE FUNCTION public.guard_credential_review_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_platform_admin(auth.uid()) OR auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'self_declared'; NEW.reviewed_by := NULL; NEW.reviewed_at := NULL; NEW.review_note := NULL;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'self_declared' THEN
      RAISE EXCEPTION 'Only platform admins can approve or reject credentials';
    END IF;
    IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR NEW.review_note IS DISTINCT FROM OLD.review_note THEN
      RAISE EXCEPTION 'Only platform admins can change review details';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_credential_review_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_credential_review ON public.org_credentials;
CREATE TRIGGER trg_guard_credential_review BEFORE INSERT OR UPDATE ON public.org_credentials
FOR EACH ROW EXECUTE FUNCTION public.guard_credential_review_fields();