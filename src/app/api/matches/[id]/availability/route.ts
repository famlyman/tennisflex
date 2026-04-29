import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

interface RouteParams {
  id: string
}

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id: matchId } = await params
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get match details to verify user is a player
  const { data: match } = await adminClient
    .from('matches')
    .select('home_player_id, away_player_id')
    .eq('id', matchId)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Verify user is part of this match
  const { data: playerData } = await adminClient
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!playerData || (match.home_player_id !== playerData.id && match.away_player_id !== playerData.id)) {
    return NextResponse.json({ error: 'Not authorized for this match' }, { status: 403 })
  }

  // Get all availability for this match
  const { data: availability } = await adminClient
    .from('match_availability')
    .select(`
      *,
      player:players (
        id,
        profile:profiles (full_name)
      )
    `)
    .eq('match_id', matchId)
    .order('available_date', { ascending: true })

  // Separate current player's availability from opponent's
  const myAvailability = (availability || [])
    .filter(a => a.player_id === playerData.id)
    .map(a => a.available_date)
  
  const opponentAvailability = (availability || [])
    .filter(a => a.player_id !== playerData.id)
    .map(a => ({
      date: a.available_date,
      player_name: a.player?.profile?.full_name || 'Opponent'
    }))

  // Get opponent info
  const opponentId = match.home_player_id === playerData.id 
    ? match.away_player_id 
    : match.home_player_id
  
  const { data: opponent } = await adminClient
    .from('players')
    .select('profile:profiles (full_name)')
    .eq('id', opponentId)
    .single()

  const opponentName = (opponent?.profile as any)?.full_name || 'Opponent'

  return NextResponse.json({
    myAvailability,
    opponentAvailability,
    opponentName,
    matchId
  })
}

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id: matchId } = await params
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
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
  const { dates } = body // Array of date strings

  if (!Array.isArray(dates)) {
    return NextResponse.json({ error: 'Dates must be an array' }, { status: 400 })
  }

  // Get match details to verify user is a player
  const { data: match } = await adminClient
    .from('matches')
    .select('home_player_id, away_player_id')
    .eq('id', matchId)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Get player
  const { data: playerData } = await adminClient
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!playerData || (match.home_player_id !== playerData.id && match.away_player_id !== playerData.id)) {
    return NextResponse.json({ error: 'Not authorized for this match' }, { status: 403 })
  }

  // Remove old availability for this player and match
  await adminClient
    .from('match_availability')
    .delete()
    .eq('match_id', matchId)
    .eq('player_id', playerData.id)

  // Insert new availability
  if (dates.length > 0) {
    const inserts = dates.map((date: string) => ({
      match_id: matchId,
      player_id: playerData.id,
      available_date: date
    }))

    const { error } = await adminClient
      .from('match_availability')
      .insert(inserts)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
