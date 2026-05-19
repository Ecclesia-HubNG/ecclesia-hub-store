ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_metadata jsonb;

CREATE INDEX IF NOT EXISTS orders_payment_reference_idx
  ON public.orders (payment_reference)
  WHERE payment_reference IS NOT NULL;
