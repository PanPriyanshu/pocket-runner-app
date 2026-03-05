
DROP POLICY "Requester or deliverer can update" ON public.orders;

CREATE POLICY "Requester or deliverer can update" ON public.orders
FOR UPDATE TO authenticated
USING (
  (auth.uid() = requester_id) OR 
  (auth.uid() = deliverer_id) OR 
  (deliverer_id IS NULL AND status = 'pending'::order_status)
);
