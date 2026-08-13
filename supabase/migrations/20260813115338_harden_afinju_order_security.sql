-- Keep role checks out of the public RPC surface and avoid recursive users RLS.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO anon, authenticated;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (private.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can edit config" ON public.config;
CREATE POLICY "Admins can edit config" ON public.config
  FOR ALL USING (private.current_user_role() = 'admin')
  WITH CHECK (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (private.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can edit products" ON public.products;
CREATE POLICY "Admins can edit products" ON public.products
  FOR ALL USING (private.current_user_role() = 'admin')
  WITH CHECK (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (private.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (private.current_user_role() IN ('admin', 'staff'))
  WITH CHECK (private.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Payment finalization is one locked transaction: the same provider reference
-- cannot be applied twice and inventory cannot be lost on concurrent webhooks.
CREATE OR REPLACE FUNCTION public.finalize_paid_order(
  p_order_id UUID,
  p_reference TEXT,
  p_source TEXT DEFAULT 'flutterwave'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_existing_order_id UUID;
BEGIN
  IF p_order_id IS NULL OR NULLIF(trim(p_reference), '') IS NULL THEN
    RAISE EXCEPTION 'Order and payment reference are required';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.payment_status = 'paid' THEN RETURN FALSE; END IF;

  INSERT INTO public.payment_references(reference, order_id, user_id, source)
  VALUES (trim(p_reference), p_order_id, v_order.user_id, p_source)
  ON CONFLICT (reference) DO NOTHING;

  SELECT order_id INTO v_existing_order_id
  FROM public.payment_references WHERE reference = trim(p_reference);
  IF v_existing_order_id <> p_order_id THEN
    RAISE EXCEPTION 'Payment reference already belongs to another order';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(v_order.items, '[]'::jsonb)) LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid order item';
    END IF;

    UPDATE public.products
    SET inventory = jsonb_set(
      COALESCE(inventory, '{}'::jsonb),
      '{soldCount}',
      to_jsonb(COALESCE((inventory->>'soldCount')::INTEGER, 0) + v_quantity),
      true
    ), updated_at = now()
    WHERE id = v_product_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product in order no longer exists'; END IF;
  END LOOP;

  UPDATE public.orders
  SET payment_status = 'paid',
      payment_reference = trim(p_reference),
      status = 'paid',
      status_timeline = COALESCE(status_timeline, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
        'status', 'paid', 'timestamp', now(), 'note', 'Payment confirmed via ' || p_source
      )),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_paid_order(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(UUID, TEXT, TEXT) TO service_role;
