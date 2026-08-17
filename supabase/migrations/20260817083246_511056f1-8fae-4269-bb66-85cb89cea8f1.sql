ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
UPDATE public.orgs SET onboarding_completed_at = now() WHERE onboarding_completed_at IS NULL;