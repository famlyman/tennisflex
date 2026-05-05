-- Create awards table for season winners
CREATE TABLE IF NOT EXISTS public.awards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  skill_level_id uuid NOT NULL REFERENCES public.skill_levels(id) ON DELETE CASCADE,
  award_type text NOT NULL, -- 'winner', 'runner_up', etc.
  title text NOT NULL, -- e.g. "Spring 2026 Winner"
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT awards_pkey PRIMARY KEY (id),
  CONSTRAINT awards_player_season_unique UNIQUE(player_id, season_id, award_type)
);

-- RLS for awards
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Awards are readable by everyone"
ON public.awards FOR SELECT
USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_awards_player_id ON public.awards(player_id);
CREATE INDEX IF NOT EXISTS idx_awards_season_id ON public.awards(season_id);
