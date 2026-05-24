ALTER TABLE public.global_promotions
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_promotions_page boolean NOT NULL DEFAULT false;
