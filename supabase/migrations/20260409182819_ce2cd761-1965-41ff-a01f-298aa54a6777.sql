
-- Create trigger function to enforce catalog prices on order_items
CREATE OR REPLACE FUNCTION public.enforce_catalog_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If add_on_id is set, look up the authoritative price
  IF NEW.add_on_id IS NOT NULL THEN
    SELECT price_cents * NEW.quantity INTO NEW.price_cents
    FROM add_ons
    WHERE id = NEW.add_on_id;
    
    IF NEW.price_cents IS NULL THEN
      RAISE EXCEPTION 'Invalid add-on ID: %', NEW.add_on_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to order_items for INSERT and UPDATE
CREATE TRIGGER enforce_order_item_price
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_catalog_price();
