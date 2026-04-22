-- Drop the overly strict policy
DROP POLICY IF EXISTS "Anyone can register with valid data" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;

-- Recreate a clean open insert policy for anon + authenticated
CREATE POLICY "Public can insert registrations"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
