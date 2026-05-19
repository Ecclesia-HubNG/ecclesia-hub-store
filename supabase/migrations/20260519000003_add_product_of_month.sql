ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_product_of_month boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_product_of_month_idx
  ON public.products (is_product_of_month)
  WHERE is_product_of_month = true;
