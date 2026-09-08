# Add `operating_countries` to `public.orgs`

## Goal
Add a searchable `operating_countries` text array column to the `public.orgs` table, backfill it from existing `profile_answers->'operating_countries'` JSONB data, and index it for fast country filtering.

## Why
The directory and map currently rely on `profile_answers` for operating-country data. Exposing that JSONB field is no longer desirable, so a dedicated, queryable column is needed while preserving existing data.

## Changes
1. Run the migration below via the Supabase migration tool.
2. Verify the column exists and the backfill populated rows as expected.
3. Confirm PostgREST recognizes the new column (the migration tool handles schema cache refresh).

## Technical details

```sql
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
```

## Out of scope
- Updating application code to read from `operating_countries` instead of `profile_answers`.
- Changing RLS policies or grants beyond what the migration requires.
