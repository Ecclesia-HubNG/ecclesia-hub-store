ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_gift boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS categories_is_gift_idx ON public.categories(is_gift);
