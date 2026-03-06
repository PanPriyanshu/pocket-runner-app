
CREATE OR REPLACE FUNCTION public.credit_deliverer(
  _order_id uuid,
  _deliverer_id uuid,
  _delivery_fee numeric,
  _rating integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update deliverer profile stats
  UPDATE profiles
  SET 
    total_deliveries = COALESCE(total_deliveries, 0) + 1,
    total_earnings = COALESCE(total_earnings, 0) + COALESCE(_delivery_fee, 0)
  WHERE user_id = _deliverer_id;

  -- Update requester total_requests
  UPDATE profiles
  SET total_requests = COALESCE(total_requests, 0) + 1
  WHERE user_id = (SELECT requester_id FROM orders WHERE id = _order_id);

  -- Insert rating if provided
  IF _rating IS NOT NULL AND _rating > 0 THEN
    INSERT INTO ratings (order_id, rater_id, rated_id, rating)
    VALUES (_order_id, auth.uid(), _deliverer_id, _rating);
    
    -- Update average rating
    UPDATE profiles
    SET average_rating = (
      SELECT COALESCE(AVG(r.rating), 0)
      FROM ratings r
      WHERE r.rated_id = _deliverer_id
    )
    WHERE user_id = _deliverer_id;
  END IF;
END;
$$;
