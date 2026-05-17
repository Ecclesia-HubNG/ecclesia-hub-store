-- Expand is_admin() to recognise all staff roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN (
      'super_admin', 'admin', 'manager', 'shop_keeper', 'financier'
    ),
    false
  )
$$;
