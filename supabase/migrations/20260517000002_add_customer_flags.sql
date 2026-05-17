ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS is_blocked  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes       text;
