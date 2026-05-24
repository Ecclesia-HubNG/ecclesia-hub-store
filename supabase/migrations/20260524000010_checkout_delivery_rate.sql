-- Replace zone_id (old shipping_zones FK) with delivery_rate_id on checkout_sessions
ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS delivery_rate_id uuid REFERENCES public.delivery_rates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_label    text;

-- Add delivery fields to orders (no FK — rates can be deleted; label preserves history)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_rate_id uuid,
  ADD COLUMN IF NOT EXISTS delivery_label   text;
