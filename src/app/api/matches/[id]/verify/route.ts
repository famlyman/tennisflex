import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'
import { sendNotification } from '@/utils/notifications'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get match details
  const { data: match, error: matchError } = await adminSupabase
    .from('matches')
    .select(`
      *,
      home_player:players!matches_home_player_id_fkey (id, profile_id),
      away_player:players!matches_away_player_id_fkey (id, profile_id),
      skill_level:skill_levels!matches_skill_level_id_fkey (
        id, division:divisions!skill_levels_division_id_fkey (
          id, season_id, organization_id
        )
      )
    `)
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const orgId = match.skill_level?.division?.organization_id

  // Check if user is a coordinator
  const { data: coordinator } = await adminSupabase
    .from('coordinators')
    .select('*')
    .eq('profile_id', user.id)
    .eq('organization_id', orgId)
    .single()

  const isCoordinator = !!coordinator
  const isPlayer = user.id === match.home_player?.profile_id || user.id === match.away_player?.profile_id

  if (!isCoordinator && !isPlayer) {
    return NextResponse.json({ error: 'Not authorized to verify this match' }, { status: 403 })
  }

  // Verify the match
  const { error: updateError } = await adminSupabase
    .from('matches')
    .update({ verified_by_opponent: true })
    .eq('id', matchId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Notify other player
  const otherPlayerProfileId = user.id === match.home_player?.profile_id 
    ? match.away_player?.profile_id 
    : match.home_player?.profile_id

  if (otherPlayerProfileId) {
    await sendNotification(adminSupabase, otherPlayerProfileId, {
      type: 'score_verified',
      title: 'Score Verified',
      message: 'The match score has been verified.',
      link: `/matches/${matchId}`,
    })
  }

  return NextResponse.json({ success: true })
}
