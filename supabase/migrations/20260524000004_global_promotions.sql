-- Global promotions — run a % discount across all active products.
-- When activated, product prices are updated in bulk and a backup is stored
-- in promo_original_price so the discount can be fully reversed on deactivation.
CREATE TABLE IF NOT EXISTS public.global_promotions (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text           NOT NULL,
  discount_pct  numeric(5,2)   NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  is_active     boolean        NOT NULL DEFAULT false,
  applied_at    timestamptz,
  created_at    timestamptz    NOT NULL DEFAULT now()
);

-- Only one promotion can be active at a time
CREATE UNIQUE INDEX IF NOT EXISTS global_promotions_one_active
  ON public.global_promotions (is_active)
  WHERE is_active = true;

-- Admins only
ALTER TABLE public.global_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions_admin" ON public.global_promotions FOR ALL USING (public.is_admin());

-- Backup column: stores the original price before a promotion was applied.
-- NULL means no global promotion is currently affecting this product.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promo_original_price numeric;
