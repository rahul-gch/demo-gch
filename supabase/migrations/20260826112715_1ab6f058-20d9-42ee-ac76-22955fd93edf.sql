GRANT SELECT, INSERT, UPDATE ON public.app_errors TO authenticated;
GRANT INSERT ON public.app_errors TO anon;
GRANT ALL ON public.app_errors TO service_role;

GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;

DROP POLICY IF EXISTS "Anonymous visitors can log errors" ON public.app_errors;
CREATE POLICY "Anonymous visitors can log errors"
ON public.app_errors FOR INSERT TO anon
WITH CHECK (user_id IS NULL);

CREATE OR REPLACE FUNCTION public.log_org_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.security_events (user_id, org_id, action, target_type, target_id, detail)
    VALUES (auth.uid(), NEW.id, 'org.created', 'org', NEW.id::text,
            jsonb_build_object('name', NEW.name, 'type', NEW.type));
    RETURN NEW;
  END IF;

  IF NEW.onboarding_completed_at IS NOT NULL
     AND (OLD.onboarding_completed_at IS NULL) THEN
    INSERT INTO public.security_events (user_id, org_id, action, target_type, target_id, detail)
    VALUES (auth.uid(), NEW.id, 'org.updated', 'org', NEW.id::text,
            jsonb_build_object('name', NEW.name, 'event', 'onboarding_completed',
                               'profile_score', NEW.profile_score));
  ELSIF NEW.profile_answers IS DISTINCT FROM OLD.profile_answers THEN
    INSERT INTO public.security_events (user_id, org_id, action, target_type, target_id, detail)
    VALUES (auth.uid(), NEW.id, 'org.profile_answers_updated', 'org', NEW.id::text,
            jsonb_build_object('name', NEW.name, 'profile_score', NEW.profile_score));
  ELSIF NEW.name IS DISTINCT FROM OLD.name
     OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.country IS DISTINCT FROM OLD.country THEN
    INSERT INTO public.security_events (user_id, org_id, action, target_type, target_id, detail)
    VALUES (auth.uid(), NEW.id, 'org.updated', 'org', NEW.id::text,
            jsonb_build_object('name', NEW.name));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_org_activity_ins ON public.orgs;
CREATE TRIGGER log_org_activity_ins
AFTER INSERT ON public.orgs
FOR EACH ROW EXECUTE FUNCTION public.log_org_activity();

DROP TRIGGER IF EXISTS log_org_activity_upd ON public.orgs;
CREATE TRIGGER log_org_activity_upd
AFTER UPDATE ON public.orgs
FOR EACH ROW EXECUTE FUNCTION public.log_org_activity();

CREATE OR REPLACE FUNCTION public.log_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (user_id, org_id, action, target_type, target_id, detail)
  VALUES (COALESCE(auth.uid(), NEW.user_id), NEW.org_id, 'org.member_joined', 'org_member', NEW.id::text,
          jsonb_build_object('display_name', NEW.display_name, 'role', NEW.role));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_member_activity_ins ON public.org_members;
CREATE TRIGGER log_member_activity_ins
AFTER INSERT ON public.org_members
FOR EACH ROW EXECUTE FUNCTION public.log_member_activity();