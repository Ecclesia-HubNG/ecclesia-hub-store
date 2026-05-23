-- Add attachment support to inbox messages
ALTER TABLE public.inbox_messages
  ADD COLUMN IF NOT EXISTS attachment jsonb;

-- SECURITY DEFINER helper so policies can check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role != 'customer'
  );
$$;

-- Allow admin users to read ALL inbox messages via the regular client
-- (required for real-time subscriptions in MessagesPanel / SupportManager)
CREATE POLICY "Admins read all inbox"
  ON public.inbox_messages FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Allow admin users to read all profiles (for customer name display)
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_user());
