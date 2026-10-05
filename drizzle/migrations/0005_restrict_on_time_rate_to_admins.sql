CREATE OR REPLACE FUNCTION public.guard_org_on_time_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.on_time_rate IS DISTINCT FROM OLD.on_time_rate
     AND NOT public.is_platform_admin(auth.uid()) THEN
    NEW.on_time_rate := OLD.on_time_rate;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_org_on_time_rate() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_org_on_time_rate ON public.orgs;
CREATE TRIGGER guard_org_on_time_rate BEFORE UPDATE ON public.orgs
FOR EACH ROW EXECUTE FUNCTION public.guard_org_on_time_rate();