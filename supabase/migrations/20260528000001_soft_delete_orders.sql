ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deleted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by_role  text,   -- 'customer' or 'admin'
  ADD COLUMN IF NOT EXISTS deleted_by_email text;

CREATE INDEX IF NOT EXISTS orders_deleted_at_idx ON public.orders (deleted_at);
