-- Create complaints table for platform owner oversight
CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT complaints_pkey PRIMARY KEY (id)
);

-- RLS for complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Players can create complaints but not view others
CREATE POLICY "Players can create complaints"
ON public.complaints FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT profile_id FROM public.players WHERE id = player_id
));

-- Admins can view all complaints
CREATE POLICY "Platform owners can view all complaints"
ON public.complaints FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'platform_owner'
  )
);

-- Platform owners can update complaints
CREATE POLICY "Platform owners can update complaints"
ON public.complaints FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'platform_owner'
  )
);
