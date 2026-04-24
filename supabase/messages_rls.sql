-- Messages RLS policies
-- Allow match participants to view/send messages

-- Players can view messages for their matches
CREATE POLICY "Match participants can view messages" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = messages.match_id
    AND (m.home_player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
         OR m.away_player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()))
  )
);

-- Players can insert messages for their matches
CREATE POLICY "Match participants can insert messages" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = messages.match_id
    AND (m.home_player_id IN (SELECT id FROM players WHERE profile_id = auth.uid())
         OR m.away_player_id IN (SELECT id FROM players WHERE profile_id = auth.uid()))
  )
);

-- Service role can manage all
CREATE POLICY "Service role can manage messages" ON messages
FOR ALL USING (auth.role() = 'service_role');

SELECT 'Messages RLS policies created' as status;