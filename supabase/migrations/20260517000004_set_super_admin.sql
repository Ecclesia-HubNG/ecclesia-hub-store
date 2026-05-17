-- Promote a user to super_admin by email.
-- Run this once in the Supabase SQL Editor (or via supabase db push).
-- Replace the email below with the account you want to make Super Admin.

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
WHERE email = 'ecclesiahubng@gmail.com';
