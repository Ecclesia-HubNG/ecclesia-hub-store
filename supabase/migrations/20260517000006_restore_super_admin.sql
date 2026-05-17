-- Restore ecclesiahubng@gmail.com back to super_admin
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
WHERE email = 'ecclesiahubng@gmail.com';
