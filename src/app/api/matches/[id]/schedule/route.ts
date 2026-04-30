import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'
import { sendNotification } from '@/utils/notifications'

interface RouteParams {
  id: string
}

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
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

  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { scheduled_at } = body

  if (!scheduled_at) {
    return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 })
  }

  // Fetch match to verify participation
  const { data: match, error: matchError } = await adminClient
    .from('matches')
    .select('*, home_player:players!matches_home_player_id_fkey(profile_id), away_player:players!matches_away_player_id_fkey(profile_id)')
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const isHome = match.home_player?.profile_id === user.id
  const isAway = match.away_player?.profile_id === user.id

  if (!isHome && !isAway) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Update match
  const { error: updateError } = await adminClient
    .from('matches')
    .update({ 
      scheduled_at,
      status: 'scheduled' 
    })
    .eq('id', matchId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Notify opponent
  const opponentProfileId = isHome ? match.away_player?.profile_id : match.home_player?.profile_id
  if (opponentProfileId) {
    await sendNotification(adminClient, opponentProfileId, {
      type: 'match_scheduled',
      title: 'Match Scheduled!',
      message: `Your match has been scheduled for ${new Date(scheduled_at).toLocaleDateString()}`,
      link: `/matches/${matchId}`
    })
  }

  return NextResponse.json({ success: true })
}
