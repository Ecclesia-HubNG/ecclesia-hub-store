-- Add columns that were referenced in code but missing from DB
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notes     text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier         text,
  ADD COLUMN IF NOT EXISTS subtotal        numeric;

-- Expand status constraint to include pending_verification and pending_bank_transfer
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'pending', 'pending_verification', 'pending_bank_transfer',
    'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  ]));
