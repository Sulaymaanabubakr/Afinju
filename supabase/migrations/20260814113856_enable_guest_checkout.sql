-- Customers can place orders without creating an account. Existing customer
-- orders remain linked to their user when one exists; new guest orders use a
-- high-entropy access token for the confirmation page instead.
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.payment_references
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_access_token TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.get_guest_order(
  p_order_id UUID,
  p_access_token TEXT
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(order_row) - 'guest_access_token'
  FROM public.orders AS order_row
  WHERE order_row.id = p_order_id
    AND order_row.guest_access_token = p_access_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_guest_order(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_guest_order(UUID, TEXT) TO anon, authenticated;
