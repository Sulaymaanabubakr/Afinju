ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN NOT NULL DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
