import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET(request: Request) {
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

  // Get player ID for this user
  const { data: player } = await adminClient
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  // Get URL params for viewing another player's availability
  const url = new URL(request.url)
  const viewPlayerId = url.searchParams.get('player_id')

  const targetPlayerId = viewPlayerId || player.id

  // Get availability for the target player
  const { data: availability } = await adminClient
    .from('player_availability')
    .select('available_date, note')
    .eq('player_id', targetPlayerId)
    .order('available_date', { ascending: true })

  return NextResponse.json({
    playerId: targetPlayerId,
    availability: (availability || []).map(a => ({
      date: a.available_date,
      note: a.note || ''
    })),
  })
}

export async function POST(request: Request) {
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

  // Get player ID for this user
  const { data: player } = await adminClient
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  const body = await request.json()
  const { dates, notes } = body // dates: Array of date strings, notes: Object {date: note}

  if (!Array.isArray(dates)) {
    return NextResponse.json({ error: 'Dates must be an array' }, { status: 400 })
  }

  // Remove old availability for this player
  await adminClient
    .from('player_availability')
    .delete()
    .eq('player_id', player.id)

  // Insert new availability
  if (dates.length > 0) {
    const inserts = dates.map((date: string) => ({
      player_id: player.id,
      available_date: date,
      note: notes && notes[date] ? notes[date] : null
    }))

    const { error } = await adminClient
      .from('player_availability')
      .insert(inserts)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Return updated availability
  const { data: availability } = await adminClient
    .from('player_availability')
    .select('available_date, note')
    .eq('player_id', player.id)
    .order('available_date', { ascending: true })

  return NextResponse.json({
    success: true,
    availability: (availability || []).map(a => ({
      date: a.available_date,
      note: a.note || ''
    })),
  })
}
