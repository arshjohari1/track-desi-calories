-- Set admin role in app_metadata for the designated admin user.
-- app_metadata is server-only and cannot be modified by the user, making it
-- safe for authorization decisions.
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'arshjohari1@gmail.com';
