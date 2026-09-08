-- Add operating_countries array to public.orgs for multi-location / multi-country supplier operations
ALTER TABLE public.orgs
ADD COLUMN IF NOT EXISTS operating_countries text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.orgs.operating_countries IS 'List of countries where the organization operates facilities, mills, offices, or manufacturing plants beyond its primary HQ.';
