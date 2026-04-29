import { SupabaseClient } from '@supabase/supabase-js'

export interface NotificationData {
  title: string
  message: string
  link?: string
  type: string
}

export async function sendNotification(
  supabase: SupabaseClient,
  userId: string,
  notification: NotificationData
) {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        read: false,
      })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}

export async function notifyMatchScoreSubmitted(
  supabase: SupabaseClient,
  opponentId: string,
  playerName: string,
  matchId: string
) {
  await sendNotification(supabase, opponentId, {
    type: 'score_submitted',
    title: 'Score Submitted',
    message: `${playerName} submitted a score. Please verify.`,
    link: `/seasons/${matchId}`,
  })
}

export async function notifySeasonRegistration(
  supabase: SupabaseClient,
  coordinatorId: string,
  playerName: string,
  seasonName: string
) {
  await sendNotification(supabase, coordinatorId, {
    type: 'season_registration',
    title: 'New Registration',
    message: `${playerName} registered for ${seasonName}.`,
    link: '/dashboard',
  })
}
