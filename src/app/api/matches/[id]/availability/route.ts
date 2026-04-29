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
<<<<<<< HEAD
        getAll() {
          return cookieStore.getAll()
        },
=======
        getAll() { return cookieStore.getAll() },
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
        setAll() {},
      },
    }
  )

<<<<<<< HEAD
  const adminSupabase = createAdminClient()
=======
  const adminClient = createAdminClient()
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

<<<<<<< HEAD
  // Get match details
  const { data: match, error: matchError } = await adminSupabase
    .from('matches')
    .select(`
      *,
      home_player:players!matches_home_player_id_fkey (id, profile:profiles!players_profile_id_fkey (full_name)),
      away_player:players!matches_away_player_id_fkey (id, profile:profiles!players_profile_id_fkey (full_name))
    `)
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Check if user is part of this match
  const { data: userPlayer } = await adminSupabase
=======
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
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

<<<<<<< HEAD
  if (!userPlayer || (userPlayer.id !== match.home_player_id && userPlayer.id !== match.away_player_id)) {
    return NextResponse.json({ error: 'Not authorized to view this match' }, { status: 403 })
  }

  // Get existing availability slots
  const { data: availability, error: availError } = await adminSupabase
    .from('match_availability')
    .select('*')
    .eq('match_id', matchId)
    .order('date', { ascending: true })

  if (availError) {
    console.error('Availability fetch error:', availError)
  }

  return NextResponse.json({
    match: {
      id: match.id,
      scheduled_at: match.scheduled_at,
      home_player: match.home_player,
      away_player: match.away_player,
    },
    availability: availability || [],
=======
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
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
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
<<<<<<< HEAD
        getAll() {
          return cookieStore.getAll()
        },
=======
        getAll() { return cookieStore.getAll() },
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
        setAll() {},
      },
    }
  )

<<<<<<< HEAD
  const adminSupabase = createAdminClient()
=======
  const adminClient = createAdminClient()
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
<<<<<<< HEAD
  const { date, time_slots } = body

  if (!date || !time_slots) {
    return NextResponse.json({ error: 'Date and time_slots are required' }, { status: 400 })
  }

  // Verify user is part of this match
  const { data: match } = await adminSupabase
    .from('matches')
    .select('home_player_id, away_player_id')
    .eq('id', matchId)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const { data: userPlayer } = await adminSupabase
=======
  const { dates } = body // Array of date strings

  if (!Array.isArray(dates)) {
    return NextResponse.json({ error: 'Dates must be an array' }, { status: 400 })
  }

  // Get player
  const { data: playerData } = await adminClient
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

<<<<<<< HEAD
  if (!userPlayer || (userPlayer.id !== match.home_player_id && userPlayer.id !== match.away_player_id)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Check if slot already exists for this date
  const { data: existingSlot } = await adminSupabase
    .from('match_availability')
    .select('id')
    .eq('match_id', matchId)
    .eq('date', date)
    .eq('player_id', userPlayer.id)
    .single()

  if (existingSlot) {
    // Update existing slot
    const { error: updateError } = await adminSupabase
      .from('match_availability')
      .update({ time_slots })
      .eq('id', existingSlot.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }
  } else {
    // Create new slot
    const { error: insertError } = await adminSupabase
      .from('match_availability')
      .insert({
        match_id: matchId,
        player_id: userPlayer.id,
        date,
        time_slots,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
    }
  }

  // Fetch updated availability
  const { data: availability } = await adminSupabase
    .from('match_availability')
    .select('*')
    .eq('match_id', matchId)
    .order('date', { ascending: true })

  return NextResponse.json({ success: true, availability: availability || [] })
=======
  if (!playerData) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
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
>>>>>>> 6e50647e457a0c6625df1175651ee6fa266aa5bb
}
