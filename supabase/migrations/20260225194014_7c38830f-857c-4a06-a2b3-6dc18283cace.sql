
ALTER TABLE public.students ADD COLUMN stripe_customer_id text;

ALTER TABLE public.orders ADD COLUMN deposit_paid boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN stripe_session_id text;
