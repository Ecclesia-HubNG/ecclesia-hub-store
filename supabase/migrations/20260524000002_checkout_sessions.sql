-- Ensure shipping_zones has a display name column (was missing from original migration)
ALTER TABLE public.shipping_zones
  ADD COLUMN IF NOT EXISTS name text;

-- ── Checkout sessions ──────────────────────────────────────────────────
-- Temporary holding record created when a customer submits the checkout
-- form but BEFORE they pay. The actual order row is only created after
-- Flutterwave confirms a successful payment in the verify endpoint.
-- This means every order in the orders table is a real, paid order.
--
-- Sessions expire after 2 hours; a cleanup job (or Supabase cron) can
-- delete rows WHERE expires_at < now().
-- ───────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_items   jsonb        NOT NULL DEFAULT '[]',
  shipping     jsonb        NOT NULL DEFAULT '{}',
  subtotal     numeric(10,2) NOT NULL,
  shipping_fee numeric(10,2) NOT NULL DEFAULT 0,
  total        numeric(10,2) NOT NULL,
  zone_id      uuid         REFERENCES public.shipping_zones(id) ON DELETE SET NULL,
  customer_id  uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  tx_ref       text,
  expires_at   timestamptz  NOT NULL DEFAULT now() + interval '2 hours',
  created_at   timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone (guest or logged-in) can create a session
CREATE POLICY "checkout_sessions_insert"
  ON public.checkout_sessions FOR INSERT
  WITH CHECK (true);

-- Admins have full access (used by the verify server action via admin client)
CREATE POLICY "checkout_sessions_admin"
  ON public.checkout_sessions FOR ALL
  USING (public.is_admin());
