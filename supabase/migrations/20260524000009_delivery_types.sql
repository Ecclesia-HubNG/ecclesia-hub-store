-- Delivery types (Express Delivery, Standard Delivery)
CREATE TABLE IF NOT EXISTS public.delivery_types (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Zones within a type (e.g. "Via Air", "Within Lagos", "Outside Lagos", "Overseas")
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id     uuid        NOT NULL REFERENCES public.delivery_types(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Rates within a zone (single area or grouped)
-- areas[] = ["Lekki"] for single; ["Lekki","VI","Ikoyi"] for grouped
CREATE TABLE IF NOT EXISTS public.delivery_rates (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id        uuid          NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  name           text          NOT NULL,
  areas          text[]        NOT NULL DEFAULT '{}',
  price          numeric(10,2) NOT NULL DEFAULT 0,
  estimated_days text,
  is_active      boolean       NOT NULL DEFAULT true,
  sort_order     int           NOT NULL DEFAULT 0,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

-- Delivery channels / logistics partners (GUO Motors, DHL, etc.)
CREATE TABLE IF NOT EXISTS public.delivery_channels (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  contact     text,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.delivery_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read delivery_types"    ON public.delivery_types    FOR SELECT USING (true);
CREATE POLICY "Public read delivery_zones"    ON public.delivery_zones    FOR SELECT USING (true);
CREATE POLICY "Public read delivery_rates"    ON public.delivery_rates    FOR SELECT USING (true);
CREATE POLICY "Public read delivery_channels" ON public.delivery_channels FOR SELECT USING (true);

CREATE POLICY "Admins manage delivery_types"    ON public.delivery_types    FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_app_meta_data->>'role' IN ('super_admin','admin','manager'))));
CREATE POLICY "Admins manage delivery_zones"    ON public.delivery_zones    FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_app_meta_data->>'role' IN ('super_admin','admin','manager'))));
CREATE POLICY "Admins manage delivery_rates"    ON public.delivery_rates    FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_app_meta_data->>'role' IN ('super_admin','admin','manager'))));
CREATE POLICY "Admins manage delivery_channels" ON public.delivery_channels FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND (auth.users.raw_app_meta_data->>'role' IN ('super_admin','admin','manager'))));

-- Seed default delivery types and zones
INSERT INTO public.delivery_types (name, description, sort_order) VALUES
  ('Express Delivery', 'Fast delivery via air freight', 0),
  ('Standard Delivery', 'Ground delivery across all regions', 1)
ON CONFLICT DO NOTHING;

-- Seed zones for Express Delivery
WITH express AS (SELECT id FROM public.delivery_types WHERE name = 'Express Delivery' LIMIT 1)
INSERT INTO public.delivery_zones (type_id, name, description, sort_order)
SELECT express.id, 'Via Air', 'Airport pickup delivery', 0 FROM express
ON CONFLICT DO NOTHING;

-- Seed zones for Standard Delivery
WITH standard AS (SELECT id FROM public.delivery_types WHERE name = 'Standard Delivery' LIMIT 1)
INSERT INTO public.delivery_zones (type_id, name, description, sort_order)
SELECT standard.id, unnest AS name, desc AS description, ord AS sort_order
FROM standard, (VALUES
  ('Within Lagos',   'Delivery within Lagos State',      0),
  ('Outside Lagos',  'Delivery to other Nigerian states', 1),
  ('Overseas',       'International delivery',            2)
) AS t(unnest, desc, ord)
ON CONFLICT DO NOTHING;
