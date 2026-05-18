-- Allow 'hero' as a valid homepage widget type
ALTER TABLE public.homepage_widgets
  DROP CONSTRAINT homepage_widgets_type_check;

ALTER TABLE public.homepage_widgets
  ADD CONSTRAINT homepage_widgets_type_check CHECK (
    type IN ('hero', 'featured_products', 'banner', 'category_grid', 'promo_strip', 'testimonials')
  );
