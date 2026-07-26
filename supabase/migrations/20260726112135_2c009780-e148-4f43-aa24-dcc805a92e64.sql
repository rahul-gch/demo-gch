
ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS moq text,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS capacity text,
  ADD COLUMN IF NOT EXISTS on_time_rate integer,
  ADD COLUMN IF NOT EXISTS materials text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating smallint;
