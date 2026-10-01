-- Follow-up to 0003_fix_c1_c4_security: the column-level SELECT list omitted
-- is_hidden (added by 0001_org_hidden_visibility), which the directory and
-- visibility checks read. It is not sensitive — grant it explicitly.
GRANT SELECT (is_hidden) ON public.orgs TO authenticated;