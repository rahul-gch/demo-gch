ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS profile_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_score integer NOT NULL DEFAULT 0;