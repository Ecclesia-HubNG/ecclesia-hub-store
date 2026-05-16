ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier         text,
  ADD COLUMN IF NOT EXISTS admin_notes     text;
