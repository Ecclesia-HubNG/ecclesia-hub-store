CREATE TABLE public.brands (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  logo        text,
  website     text,
  is_featured boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.brands FOR ALL USING (true);
