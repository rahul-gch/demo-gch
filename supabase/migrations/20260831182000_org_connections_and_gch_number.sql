-- Migration: Create org_connections table and universal GCH number sequence

-- 1. Create a persistent sequence for Universal GCH Numbers
CREATE SEQUENCE IF NOT EXISTS public.org_gch_seq START WITH 100001;

-- 2. Add gch_number column to public.orgs if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orgs' AND column_name = 'gch_number'
  ) THEN
    ALTER TABLE public.orgs ADD COLUMN gch_number TEXT UNIQUE;
  END IF;
END $$;

-- 3. Auto-populate existing organizations with gch_number if missing
UPDATE public.orgs
SET gch_number = 'GCH-' || UPPER(COALESCE(SUBSTRING(country FROM 1 FOR 2), 'GL')) || '-' || nextval('public.org_gch_seq')
WHERE gch_number IS NULL;

-- 4. Create trigger to automatically generate gch_number for newly registered organizations
CREATE OR REPLACE FUNCTION public.set_org_gch_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gch_number IS NULL THEN
    NEW.gch_number := 'GCH-' || UPPER(COALESCE(SUBSTRING(NEW.country FROM 1 FOR 2), 'GL')) || '-' || nextval('public.org_gch_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_org_gch_number ON public.orgs;
CREATE TRIGGER trigger_set_org_gch_number
BEFORE INSERT ON public.orgs
FOR EACH ROW
EXECUTE FUNCTION public.set_org_gch_number();

-- 5. Create persistent org_connections table
CREATE TABLE IF NOT EXISTS public.org_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  to_org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_org_connection UNIQUE (from_org_id, to_org_id)
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_org_connections_from ON public.org_connections(from_org_id);
CREATE INDEX IF NOT EXISTS idx_org_connections_to ON public.org_connections(to_org_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.org_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Members can view connections involving their organizations" ON public.org_connections;
DROP POLICY IF EXISTS "Members can request connections on behalf of their organization" ON public.org_connections;
DROP POLICY IF EXISTS "Recipient or sender can update connection status" ON public.org_connections;

-- Select Policy
CREATE POLICY "Members can view connections involving their organizations"
ON public.org_connections FOR SELECT
TO authenticated
USING (
  from_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()) OR
  to_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

-- Insert Policy
CREATE POLICY "Members can request connections on behalf of their organization"
ON public.org_connections FOR INSERT
TO authenticated
WITH CHECK (
  from_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

-- Update Policy
CREATE POLICY "Recipient or sender can update connection status"
ON public.org_connections FOR UPDATE
TO authenticated
USING (
  to_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()) OR
  from_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);
