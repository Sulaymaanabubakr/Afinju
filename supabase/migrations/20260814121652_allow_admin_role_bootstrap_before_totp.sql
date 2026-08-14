-- The login screen must be able to read the current user's own role at AAL1
-- in order to decide whether to start TOTP enrollment. Other user rows and
-- all admin operations remain protected by the AAL2 restrictive policy.
DROP POLICY IF EXISTS "Require TOTP for admin access" ON public.users;
CREATE POLICY "Require TOTP for admin access" ON public.users
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR private.current_user_role() NOT IN ('admin', 'staff')
    OR (SELECT auth.jwt()->>'aal') = 'aal2'
  )
  WITH CHECK (
    (SELECT auth.uid()) = id
    OR private.current_user_role() NOT IN ('admin', 'staff')
    OR (SELECT auth.jwt()->>'aal') = 'aal2'
  );
