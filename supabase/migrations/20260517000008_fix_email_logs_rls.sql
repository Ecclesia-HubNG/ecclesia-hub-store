-- The previous policy had WITH CHECK (false) which could block inserts
-- even from the service role in some Supabase configurations.
-- Drop it and let RLS + service role bypass handle access control.

DROP POLICY IF EXISTS "service role only" ON public.email_logs;

-- No policies needed: the admin client uses the service role key which
-- bypasses RLS entirely. Anon / authenticated users get no access by default
-- when RLS is enabled and no policy grants them access.
