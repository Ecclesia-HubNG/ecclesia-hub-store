-- ============================================================
-- Ecclesia Hub — Full Database Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- ============================================================


-- ============================================================
-- Helper: is_admin()
-- Checks app_metadata.role = 'admin' on the JWT.
-- To grant admin: set app_metadata { "role": "admin" } via
-- Supabase dashboard (Authentication > Users > Edit user)
-- or via service-role call to auth.admin.updateUserById().
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;


-- ============================================================
-- Table: categories
-- (created before products so FK resolves)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  image       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public: read
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  USING (true);

-- Admin: insert / update / delete
CREATE POLICY "categories_admin_insert"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_update"
  ON public.categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "categories_admin_delete"
  ON public.categories FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- Table: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text UNIQUE NOT NULL,
  description      text,
  price            numeric NOT NULL,
  compare_at_price numeric,
  category_id      uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  images           text[],
  thumbnail        text,
  stock            integer NOT NULL DEFAULT 0,
  is_featured      boolean NOT NULL DEFAULT false,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_slug_idx        ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_is_active_idx   ON public.products(is_active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public: read active products only
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Admin: read everything (including inactive)
CREATE POLICY "products_admin_read"
  ON public.products FOR SELECT
  USING (public.is_admin());

-- Admin: insert / update / delete
CREATE POLICY "products_admin_insert"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "products_admin_delete"
  ON public.products FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- Table: customers
-- One row per auth.users entry; created on sign-up via trigger.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  email            text,
  phone            text,
  shipping_address jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Users: read & update their own row
CREATE POLICY "customers_self_read"
  ON public.customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "customers_self_update"
  ON public.customers FOR UPDATE
  USING (auth.uid() = id);

-- Admin: full access
CREATE POLICY "customers_admin_read"
  ON public.customers FOR SELECT
  USING (public.is_admin());

CREATE POLICY "customers_admin_update"
  ON public.customers FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "customers_admin_delete"
  ON public.customers FOR DELETE
  USING (public.is_admin());

-- Auto-create customer row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- Table: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'pending',
  total             numeric NOT NULL,
  items             jsonb NOT NULL DEFAULT '[]',
  shipping_address  jsonb,
  payment_reference text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT orders_status_check CHECK (
    status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
  )
);

CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_status_idx       ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers: read their own orders
CREATE POLICY "orders_self_read"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers: create their own orders
CREATE POLICY "orders_self_insert"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Admin: full access
CREATE POLICY "orders_admin_read"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "orders_admin_insert"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "orders_admin_update"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "orders_admin_delete"
  ON public.orders FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- Table: homepage_widgets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homepage_widgets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,
  config     jsonb NOT NULL DEFAULT '{}',
  position   integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT homepage_widgets_type_check CHECK (
    type IN ('featured_products', 'banner', 'category_grid', 'promo_strip', 'testimonials')
  )
);

CREATE INDEX IF NOT EXISTS homepage_widgets_position_idx ON public.homepage_widgets(position);

ALTER TABLE public.homepage_widgets ENABLE ROW LEVEL SECURITY;

-- Public: read active widgets
CREATE POLICY "widgets_public_read"
  ON public.homepage_widgets FOR SELECT
  USING (is_active = true);

-- Admin: full access
CREATE POLICY "widgets_admin_read"
  ON public.homepage_widgets FOR SELECT
  USING (public.is_admin());

CREATE POLICY "widgets_admin_insert"
  ON public.homepage_widgets FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "widgets_admin_update"
  ON public.homepage_widgets FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "widgets_admin_delete"
  ON public.homepage_widgets FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- Done
-- ============================================================
