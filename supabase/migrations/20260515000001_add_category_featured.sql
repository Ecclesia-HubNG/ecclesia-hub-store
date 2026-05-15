ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
