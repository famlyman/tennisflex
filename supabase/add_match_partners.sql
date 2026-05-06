-- Update matches table to support doubles partners
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS home_partner_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS away_partner_id uuid REFERENCES public.players(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_matches_home_partner ON public.matches(home_partner_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_partner ON public.matches(away_partner_id);

-- Verify
SELECT 'matches table updated with partner columns' as status;
