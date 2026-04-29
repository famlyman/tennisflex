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
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

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

  const body = await request.json()
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
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

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
}
