
-- Create site_settings table to store site configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
    id text PRIMARY KEY,
    content jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.site_settings
    FOR SELECT USING (true);

-- Allow authenticated users with admin roles to update
-- We check if the user has an admin role in the user_roles table
CREATE POLICY "Allow admin update access" ON public.site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('super_admin', 'content_manager')
        )
    );

-- Insert default data if it doesn't exist
INSERT INTO public.site_settings (id, content)
VALUES ('srijan_fest', '{}')
ON CONFLICT (id) DO NOTHING;
