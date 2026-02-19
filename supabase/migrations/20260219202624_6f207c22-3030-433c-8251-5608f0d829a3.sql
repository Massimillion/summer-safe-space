
-- Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Allow admins to read user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow users to read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Schools enum
CREATE TYPE public.school_enum AS ENUM ('cu_boulder', 'du');

-- Packages (admin-configured)
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  num_boxes INTEGER NOT NULL DEFAULT 2,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add-ons (admin-configured)
CREATE TABLE public.add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active add-ons" ON public.add_ons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage add-ons" ON public.add_ons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Dorms / buildings per school
CREATE TABLE public.dorms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school school_enum NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.dorms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active dorms" ON public.dorms FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage dorms" ON public.dorms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Available dates (admin-configured)
CREATE TYPE public.date_type AS ENUM ('dropoff', 'pickup');

CREATE TABLE public.available_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school school_enum NOT NULL,
  date_type date_type NOT NULL,
  available_date DATE NOT NULL,
  time_slot TEXT, -- e.g. "9am-12pm", only for pickups
  slots_remaining INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.available_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active dates" ON public.available_dates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage dates" ON public.available_dates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Students (linked to auth.users)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  school school_enum NOT NULL,
  dorm_id UUID REFERENCES public.dorms(id),
  address_line TEXT,
  is_off_campus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own profile" ON public.students FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can update own profile" ON public.students FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all students" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Allow insert for authenticated" ON public.students FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Parents
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own parents" ON public.parents FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Allow insert for own student" ON public.parents FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Admins can view all parents" ON public.parents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order status enum
CREATE TYPE public.order_status AS ENUM ('booked', 'boxes_delivered', 'boxes_picked_up', 'in_storage', 'delivered_back', 'cancelled');

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.packages(id),
  custom_box_count INTEGER,
  dropoff_date_id UUID REFERENCES public.available_dates(id),
  pickup_date_id UUID REFERENCES public.available_dates(id),
  status order_status NOT NULL DEFAULT 'booked',
  comments TEXT,
  total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own orders" ON public.orders FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Allow insert for own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Order items (add-ons selected)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  add_on_id UUID REFERENCES public.add_ons(id),
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own order items" ON public.order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT o.id FROM public.orders o JOIN public.students s ON o.student_id = s.id WHERE s.user_id = auth.uid()));
CREATE POLICY "Allow insert for own order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT o.id FROM public.orders o JOIN public.students s ON o.student_id = s.id WHERE s.user_id = auth.uid()));
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Warehouse locations
CREATE TABLE public.warehouse_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  zone TEXT,
  shelf TEXT,
  bin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage warehouse" ON public.warehouse_locations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'stripe', -- stripe, manual, adjustment
  stripe_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT TO authenticated
  USING (order_id IN (SELECT o.id FROM public.orders o JOIN public.students s ON o.student_id = s.id WHERE s.user_id = auth.uid()));
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
