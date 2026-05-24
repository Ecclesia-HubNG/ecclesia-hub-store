ALTER TABLE public.global_promotions
  ADD COLUMN IF NOT EXISTS max_discount_amount numeric;
