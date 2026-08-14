-- TOTP is intentionally removed from the admin flow. Restore the normal
-- authenticated admin policies and leave customer access unchanged.
DROP POLICY IF EXISTS "Require TOTP for admin access" ON public.users;
DROP POLICY IF EXISTS "Require TOTP for admin access" ON public.products;
DROP POLICY IF EXISTS "Require TOTP for admin access" ON public.orders;
DROP POLICY IF EXISTS "Require TOTP for admin access" ON public.config;
DROP POLICY IF EXISTS "Require TOTP for admin product image access" ON storage.objects;
