
-- Add event_name column to registration_form_fields for per-event forms
ALTER TABLE public.registration_form_fields 
ADD COLUMN event_name text NOT NULL DEFAULT 'general';

-- Create index for faster lookups by event
CREATE INDEX idx_form_fields_event ON public.registration_form_fields(event_name);
