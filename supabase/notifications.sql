-- Notifications System
-- Track user notifications for in-app and email alerts

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- Users can mark their own as read
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Service role can manage all
CREATE POLICY "Service role can manage notifications" ON notifications
FOR ALL USING (auth.role() = 'service_role');

-- Verify
SELECT 'notifications table created' as status;

-- Types reference (for documentation)
-- Types: match_scheduled, score_submitted, score_verified, season_registration, season_start, season_end, rating_change, message_received, flag_submitted