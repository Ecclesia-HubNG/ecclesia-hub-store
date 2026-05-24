ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_new_arrival boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_new_arrival_idx ON public.products (is_new_arrival)
  WHERE is_new_arrival = true;
