
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'form_manager', 'content_manager', 'event_manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user has any admin role
CREATE OR REPLACE FUNCTION public.has_any_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS: users can see their own roles, super_admin can see all
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  event TEXT NOT NULL,
  message TEXT,
  custom_fields JSONB DEFAULT '{}',
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public registration)
CREATE POLICY "Anyone can register"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admin roles can view registrations
CREATE POLICY "Admins can view registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

-- Only admins can update registrations (check-in)
CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE
  TO authenticated
  USING (public.has_any_admin_role(auth.uid()));

-- Registration form fields (dynamic form config)
CREATE TABLE public.registration_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_form_fields ENABLE ROW LEVEL SECURITY;

-- Anyone can read form fields (needed for public registration form)
CREATE POLICY "Anyone can view form fields"
  ON public.registration_form_fields FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only super_admin can manage form fields
CREATE POLICY "Super admin can manage form fields"
  ON public.registration_form_fields FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert default form fields
INSERT INTO public.registration_form_fields (field_name, field_label, field_type, is_required, sort_order) VALUES
  ('name', 'Full Name', 'text', true, 1),
  ('email', 'Email', 'email', true, 2),
  ('phone', 'Phone (WhatsApp)', 'tel', false, 3),
  ('organization', 'Organization', 'text', false, 4),
  ('event', 'Select Event', 'select', true, 5),
  ('message', 'Message', 'textarea', false, 6);

-- Update the event field with options
UPDATE public.registration_form_fields
SET options = '["Demo Day (GVFP)", "Partner Unity Fest", "Startup Expo", "Project Exception", "Main Stage Event", "Speed Networking"]'::jsonb
WHERE field_name = 'event';
