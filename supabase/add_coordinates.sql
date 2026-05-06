-- Add latitude and longitude to organizations for proximity search
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Update existing Foothills Flex with coordinates (Hickory, NC)
UPDATE public.organizations 
SET latitude = 35.7332, longitude = -81.3412 
WHERE slug = 'tennis-flex-foothills';

-- Update Seattle Flex (Seattle, WA)
UPDATE public.organizations 
SET latitude = 47.6062, longitude = -122.3321 
WHERE slug = 'seattle-test';
