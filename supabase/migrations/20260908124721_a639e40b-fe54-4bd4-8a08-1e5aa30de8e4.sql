ALTER TABLE public.orgs
ADD COLUMN IF NOT EXISTS operating_countries text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.orgs
SET operating_countries = ARRAY(
  SELECT jsonb_array_elements_text(profile_answers->'operating_countries')
)
WHERE profile_answers ? 'operating_countries'
  AND jsonb_typeof(profile_answers->'operating_countries') = 'array'
  AND operating_countries = '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_orgs_operating_countries
ON public.orgs USING GIN (operating_countries);