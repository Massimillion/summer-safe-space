
-- Drop the overly broad student UPDATE policy
DROP POLICY IF EXISTS "Students can update own booked orders" ON public.orders;

-- Create a secure RPC function that only allows updating safe fields
CREATE OR REPLACE FUNCTION public.update_order_details(
  _order_id uuid,
  _package_id uuid DEFAULT NULL,
  _dropoff_date_id uuid DEFAULT NULL,
  _pickup_date_id uuid DEFAULT NULL,
  _storage_term text DEFAULT NULL,
  _comments text DEFAULT NULL,
  _total_cents integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_id uuid;
  _order_status order_status;
BEGIN
  -- Verify the order belongs to the authenticated user and is still booked
  SELECT o.student_id, o.status INTO _student_id, _order_status
  FROM orders o
  JOIN students s ON o.student_id = s.id
  WHERE o.id = _order_id AND s.user_id = auth.uid();

  IF _student_id IS NULL THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;

  IF _order_status <> 'booked' THEN
    RAISE EXCEPTION 'Only booked orders can be edited';
  END IF;

  -- Recalculate total server-side from package + add-ons
  -- We accept _total_cents from client but verify it
  DECLARE
    _computed_total integer := 0;
    _pkg_price integer;
    _term text;
  BEGIN
    _term := COALESCE(_storage_term, 'summer');
    
    -- Get package price
    IF _package_id IS NOT NULL THEN
      SELECT price_cents INTO _pkg_price FROM packages WHERE id = _package_id AND is_active = true;
      IF _pkg_price IS NULL THEN
        RAISE EXCEPTION 'Invalid package selected';
      END IF;
      _computed_total := _pkg_price;
    END IF;

    -- Add order_items total (these are managed separately via RLS)
    SELECT COALESCE(SUM(price_cents), 0) INTO _computed_total
    FROM (
      SELECT price_cents FROM order_items WHERE order_id = _order_id
    ) items;
    _computed_total := _computed_total + COALESCE(_pkg_price, 0);

    -- Apply study_abroad multiplier to package price only
    IF _term = 'study_abroad' AND _pkg_price IS NOT NULL THEN
      _computed_total := _computed_total + _pkg_price; -- double the package price
    END IF;

    -- Update only safe fields
    UPDATE orders SET
      package_id = COALESCE(_package_id, orders.package_id),
      dropoff_date_id = _dropoff_date_id,
      pickup_date_id = _pickup_date_id,
      storage_term = COALESCE(_storage_term, orders.storage_term),
      comments = _comments,
      total_cents = _computed_total,
      updated_at = now()
    WHERE id = _order_id;
  END;
END;
$$;
