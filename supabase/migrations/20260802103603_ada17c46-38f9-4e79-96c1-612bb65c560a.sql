-- Step 1: Add created_by column to orgs
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Backfill from the first owner of each org
UPDATE public.orgs o
SET created_by = sub.user_id
FROM (
  SELECT DISTINCT ON (org_id) org_id, user_id
  FROM public.org_members
  WHERE role = 'owner'
  ORDER BY org_id, joined_at ASC
) sub
WHERE o.id = sub.org_id
  AND o.created_by IS NULL;

-- Step 3: Trigger to auto-set created_by on insert
CREATE OR REPLACE FUNCTION public.set_org_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orgs_set_created_by ON public.orgs;
CREATE TRIGGER orgs_set_created_by
  BEFORE INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_org_created_by();

-- Step 4: Fix critical — restrict bootstrap owner to org creator only
DROP POLICY IF EXISTS "members bootstrap first owner" ON public.org_members;

CREATE POLICY "members bootstrap first owner"
  ON public.org_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = org_members.org_id
    )
    AND EXISTS (
      SELECT 1 FROM public.orgs o
      WHERE o.id = org_members.org_id
        AND o.created_by = auth.uid()
    )
  );

-- Step 5: Fix warn — orgs UPDATE policy targets 'public' instead of 'authenticated'
DROP POLICY IF EXISTS "orgs editable by managers" ON public.orgs;

CREATE POLICY "orgs editable by managers"
  ON public.orgs
  FOR UPDATE TO authenticated
  USING (public.user_can_edit(auth.uid(), id))
  WITH CHECK (public.user_can_edit(auth.uid(), id));