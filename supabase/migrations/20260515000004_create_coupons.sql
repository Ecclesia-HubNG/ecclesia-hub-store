CREATE TABLE public.coupons (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  code              text        NOT NULL UNIQUE,
  description       text,
  discount_type     text        NOT NULL DEFAULT 'percentage'
                    CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value    numeric     NOT NULL,
  min_order_amount  numeric,
  max_uses          integer,
  used_count        integer     NOT NULL DEFAULT 0,
  expires_at        timestamptz,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.coupons FOR ALL USING (true);
