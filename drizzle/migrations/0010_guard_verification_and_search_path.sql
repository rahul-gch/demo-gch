-- 1. Guard review fields on public.org_verification
-- Platform admins can set any status and review fields.
-- Non-admins can only insert/update with 'not_submitted' or 'pending',
-- and are prevented from forging review details (reviewed_by, reviewed_at, note).

CREATE OR REPLACE FUNCTION public.guard_verification_review_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_platform_admin(auth.uid()) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('not_submitted', 'pending') THEN
      NEW.status := 'pending';
    END IF;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.note := NULL;
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('not_submitted', 'pending') THEN
      RAISE EXCEPTION 'Only platform admins can verify or reject business verification';
    END IF;
    IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.note IS DISTINCT FROM OLD.note THEN
      RAISE EXCEPTION 'Only platform admins can change verification review details';
    END IF;
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.guard_verification_review_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_verification_review ON public.org_verification;
CREATE TRIGGER trg_guard_verification_review BEFORE INSERT OR UPDATE ON public.org_verification
FOR EACH ROW EXECUTE FUNCTION public.guard_verification_review_fields();

-- 2. Lock down search_path on elevated SECURITY DEFINER helper functions
-- Prevents schema search path hijacking
ALTER FUNCTION public.is_platform_admin(uuid) SET search_path = public;
ALTER FUNCTION public.is_org_owner(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_can_view(uuid, uuid) SET search_path = public;
