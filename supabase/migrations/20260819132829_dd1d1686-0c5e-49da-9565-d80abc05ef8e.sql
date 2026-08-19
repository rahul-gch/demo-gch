CREATE TABLE public.app_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'browser',
  message text NOT NULL,
  stack text,
  route text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  user_agent text,
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT INSERT, SELECT, UPDATE ON public.app_errors TO authenticated;
GRANT ALL ON public.app_errors TO service_role;

ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own errors"
ON public.app_errors FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Platform admins can read errors"
ON public.app_errors FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can resolve errors"
ON public.app_errors FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE INDEX app_errors_occurred_at_idx ON public.app_errors (occurred_at DESC);
CREATE INDEX app_errors_unresolved_idx ON public.app_errors (resolved_at) WHERE resolved_at IS NULL;