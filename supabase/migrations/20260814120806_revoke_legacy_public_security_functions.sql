-- These legacy helpers are not part of the current app flow and must not be
-- callable as public SECURITY DEFINER RPC endpoints.
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
