ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_is_bestseller_idx ON public.products(is_bestseller);
