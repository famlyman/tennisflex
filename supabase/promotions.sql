-- Create promotions table for hybrid ads
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL, -- Null for global ads
  type text NOT NULL, -- 'direct', 'affiliate', 'placeholder'
  title text NOT NULL,
  description text,
  image_url text,
  link_url text,
  call_to_action text DEFAULT 'Learn More',
  is_active boolean DEFAULT true,
  display_locations text[], -- ['landing', 'dashboard', 'match_hub', 'leaderboard']
  priority integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
);

-- RLS for promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotions are readable by everyone"
ON public.promotions FOR SELECT
USING (true);

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_promotions_org_id ON public.promotions(organization_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
