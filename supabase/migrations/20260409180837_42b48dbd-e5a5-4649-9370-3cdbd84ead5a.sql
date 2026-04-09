
-- Allow students to update their own orders only when status is 'booked'
CREATE POLICY "Students can update own booked orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  status = 'booked'
  AND student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
)
WITH CHECK (
  status = 'booked'
  AND student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())
);

-- Allow students to delete their own order items when order is booked
CREATE POLICY "Students can delete own order items on booked orders"
ON public.order_items
FOR DELETE
TO authenticated
USING (
  order_id IN (
    SELECT o.id FROM orders o
    JOIN students s ON o.student_id = s.id
    WHERE s.user_id = auth.uid() AND o.status = 'booked'
  )
);
