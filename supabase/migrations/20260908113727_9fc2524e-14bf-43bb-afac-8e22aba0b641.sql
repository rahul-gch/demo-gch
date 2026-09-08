ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS operating_countries text[] NOT NULL DEFAULT '{}';

GRANT SELECT (operating_countries) ON public.orgs TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_org_operating_countries()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_answers ? 'operating_countries'
     AND jsonb_typeof(NEW.profile_answers->'operating_countries') = 'array' THEN
    NEW.operating_countries := ARRAY(
      SELECT jsonb_array_elements_text(NEW.profile_answers->'operating_countries')
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_org_operating_countries ON public.orgs;
CREATE TRIGGER sync_org_operating_countries
BEFORE INSERT OR UPDATE OF profile_answers ON public.orgs
FOR EACH ROW EXECUTE FUNCTION public.sync_org_operating_countries();

UPDATE public.orgs
SET operating_countries = ARRAY(
  SELECT jsonb_array_elements_text(profile_answers->'operating_countries')
)
WHERE jsonb_typeof(profile_answers->'operating_countries') = 'array';