
-- Drop and recreate the registration insert policy with validation
DROP POLICY "Anyone can register" ON public.registrations;

CREATE POLICY "Anyone can register with valid data"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND name <> '' AND
    email IS NOT NULL AND email <> '' AND
    event IS NOT NULL AND event <> ''
  );
