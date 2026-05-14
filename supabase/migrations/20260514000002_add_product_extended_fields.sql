ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku                 text,
  ADD COLUMN IF NOT EXISTS barcode             text,
  ADD COLUMN IF NOT EXISTS brand               text,
  ADD COLUMN IF NOT EXISTS weight              numeric,
  ADD COLUMN IF NOT EXISTS dimensions          jsonb    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_product_ids uuid[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sale_price          numeric,
  ADD COLUMN IF NOT EXISTS sale_starts_at      date,
  ADD COLUMN IF NOT EXISTS sale_ends_at        date,
  ADD COLUMN IF NOT EXISTS video_url           text,
  ADD COLUMN IF NOT EXISTS meta_title          text,
  ADD COLUMN IF NOT EXISTS meta_description    text;
