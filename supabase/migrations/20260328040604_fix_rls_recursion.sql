-- Create a security definer function to check user roles without triggering RLS recursively
CREATE OR REPLACE FUNCTION get_user_role(query_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Return null if no UUID provided
    IF query_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role::text INTO user_role FROM users WHERE id = query_user_id;
    RETURN user_role;
END;
$$;

-- Drop all the old recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can edit config" ON config;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can edit products" ON products;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));
CREATE POLICY "Admins can edit config" ON config FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can view all products" ON products FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));
CREATE POLICY "Admins can edit products" ON products FOR ALL USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'staff'));
