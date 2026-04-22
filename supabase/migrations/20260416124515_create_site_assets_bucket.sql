
-- Create the site-assets storage bucket for admin image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy (anyone can view images)
CREATE POLICY "Public read access for site-assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

-- Authenticated (admin) users can upload
CREATE POLICY "Admins can upload site-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'site-assets'
    AND public.has_any_admin_role(auth.uid())
  );

-- Authenticated (admin) users can update
CREATE POLICY "Admins can update site-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND public.has_any_admin_role(auth.uid())
  );

-- Authenticated (admin) users can delete
CREATE POLICY "Admins can delete site-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'site-assets'
    AND public.has_any_admin_role(auth.uid())
  );
