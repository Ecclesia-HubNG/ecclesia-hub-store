-- Shipping zones: country → state → area with price
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country    text        NOT NULL DEFAULT 'Nigeria',
  state      text        NOT NULL,
  area       text,                          -- NULL means applies to entire state
  price      numeric(10,2) NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anon/customer to read active zones for checkout
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage shipping zones"
  ON public.shipping_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_app_meta_data->>'role' IN ('super_admin','admin','manager'))
    )
  );

-- Add shipping_fee column to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(10,2) NOT NULL DEFAULT 0;
