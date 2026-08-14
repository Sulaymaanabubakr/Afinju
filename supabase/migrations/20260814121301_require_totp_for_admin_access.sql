-- Admin/staff sessions must complete Supabase MFA before they can use the
-- authenticated admin policies. Customer sessions remain unaffected.
DO $policy$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users', 'products', 'orders', 'config'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Require TOTP for admin access" ON public.%I', table_name);
    EXECUTE format($sql$
      CREATE POLICY "Require TOTP for admin access" ON public.%I
        AS RESTRICTIVE FOR ALL TO authenticated
        USING (
          private.current_user_role() NOT IN ('admin', 'staff')
          OR (SELECT auth.jwt()->>'aal') = 'aal2'
        )
        WITH CHECK (
          private.current_user_role() NOT IN ('admin', 'staff')
          OR (SELECT auth.jwt()->>'aal') = 'aal2'
        )
    $sql$, table_name);
  END LOOP;
END
$policy$;

-- Storage writes for the product-images bucket are also protected by the
-- same AAL2 requirement, while public reads remain public.
DROP POLICY IF EXISTS "Require TOTP for admin product image access" ON storage.objects;
CREATE POLICY "Require TOTP for admin product image access" ON storage.objects
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    bucket_id <> 'product-images'
    OR private.current_user_role() NOT IN ('admin', 'staff')
    OR (SELECT auth.jwt()->>'aal') = 'aal2'
  )
  WITH CHECK (
    bucket_id <> 'product-images'
    OR private.current_user_role() NOT IN ('admin', 'staff')
    OR (SELECT auth.jwt()->>'aal') = 'aal2'
  );
