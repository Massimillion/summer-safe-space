
-- Add description and requires_address columns to dorms
ALTER TABLE public.dorms ADD COLUMN description text;
ALTER TABLE public.dorms ADD COLUMN requires_address boolean NOT NULL DEFAULT false;
ALTER TABLE public.dorms ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Insert CU Boulder locations
INSERT INTO public.dorms (name, school, description, requires_address, sort_order) VALUES
  ('Engineering Quad', 'cu_boulder', 'Aiden Hall, Brackett Hall, Cockerell Hall, Crossman Hall', false, 1),
  ('Kittredge Complex', 'cu_boulder', 'Andrews Hall, Arnett Hall, Buckingham Hall, Kittredge Central Hall, Kittredge West Hall, Smith Hall', false, 2),
  ('Williams Village', 'cu_boulder', 'Darley Commons, Darley Towers, Stearn Towers, Williams Village North, Williams Village East', false, 3),
  ('Central Campus & Others', 'cu_boulder', 'Baker Hall, Cheyenne Arapahoe Hall, Farrand Hall, Hallett Hall, Libby Hall, Sewall Hall, Willard Hall', false, 4),
  ('Apartment Style', 'cu_boulder', NULL, true, 5);

-- Insert DU locations
INSERT INTO public.dorms (name, school, description, requires_address, sort_order) VALUES
  ('Dimond', 'du', NULL, false, 1),
  ('Centennial Halls', 'du', NULL, false, 2),
  ('Centennial Towers', 'du', NULL, false, 3),
  ('Nelson/Nagel/JMAC', 'du', NULL, false, 4),
  ('Off Campus', 'du', NULL, true, 5);
