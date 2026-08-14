-- Keep operational payment and audit records private while allowing staff
-- access through the existing role-check function.
DROP POLICY IF EXISTS "Admins can view payment references" ON public.payment_references;
CREATE POLICY "Admins can view payment references" ON public.payment_references
  FOR SELECT TO authenticated
  USING (private.current_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (private.current_user_role() IN ('admin', 'staff'));

-- Finalize payment and inventory in one locked transaction. Limited products
-- cannot be marked paid once their configured inventory limit is exhausted;
-- backorder-enabled products remain available.
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
    WHERE id = v_product_id
      AND (
        COALESCE((inventory->>'allowBackorder')::BOOLEAN, false)
        OR COALESCE((inventory->>'soldCount')::INTEGER, 0) + v_quantity
           <= COALESCE((inventory->>'launchEditionLimit')::INTEGER, 0)
      );

    IF NOT FOUND THEN
      IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = v_product_id) THEN
        RAISE EXCEPTION 'Product in order no longer exists';
      END IF;
      RAISE EXCEPTION 'Product inventory is no longer available';
    END IF;
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
