CREATE TABLE IF NOT EXISTS public.promotion_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.global_promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, product_id)
);

CREATE INDEX IF NOT EXISTS promotion_products_promo_idx ON public.promotion_products (promotion_id);
