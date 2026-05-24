ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_channel text NOT NULL DEFAULT 'store',
  ADD COLUMN IF NOT EXISTS is_manual     boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_channel_check CHECK (
    order_channel IN ('store', 'instagram', 'tiktok', 'facebook', 'whatsapp', 'referral', 'manual')
  );
