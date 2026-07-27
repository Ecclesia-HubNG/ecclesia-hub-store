INSERT INTO public.coupons (code, description, discount_type, discount_value, is_active)
VALUES ('WELCOME15', 'Newsletter signup — 15% off', 'percentage', 15, true)
ON CONFLICT (code) DO NOTHING;
