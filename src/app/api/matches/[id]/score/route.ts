import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

interface RouteParams {
  id: string
}

export async function PUT(request: Request, { params }: { params: Promise<RouteParams> }) {
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
  const { score, winner_id } = body

  if (!score || !winner_id) {
    return NextResponse.json({ error: 'Score and winner_id are required' }, { status: 400 })
  }

  const { data: match, error: matchError } = await adminSupabase
    .from('matches')
    .select(`
      *,
      skill_level:skill_levels!matches_skill_level_id_fkey (
        *,
        division:divisions!skill_levels_division_id_fkey (
          *,
          season:seasons!divisions_season_id_fkey (
            *,
            organization:organizations!seasons_organization_id_fkey (id)
          )
        )
      )
    `)
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const orgId = match.skill_level?.division?.season?.organization_id

  const { data: coordinator } = await adminSupabase
    .from('coordinators')
    .select('*')
    .eq('profile_id', user.id)
    .eq('organization_id', orgId)
    .single()

  const isCoordinator = !!coordinator

  const { data: userPlayer } = await adminSupabase
    .from('players')
    .select('id')
    .eq('profile_id', user.id)
    .eq('organization_id', orgId)
    .maybeSingle()

  const isPlayer = userPlayer && (userPlayer.id === match.home_player_id || userPlayer.id === match.away_player_id)

  if (!isCoordinator && !isPlayer) {
    return NextResponse.json({ error: 'Not authorized to update this match' }, { status: 403 })
  }

  if (winner_id !== match.home_player_id && winner_id !== match.away_player_id) {
    return NextResponse.json({ error: 'Winner must be one of the players' }, { status: 400 })
  }

  const { error: updateError } = await adminSupabase
    .from('matches')
    .update({
      score,
      winner_id,
      status: 'completed'
    })
    .eq('id', matchId)

  if (updateError) {
    console.error('Match update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, match_id: matchId })
}

export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }) {
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

  const { data: match, error: matchError } = await adminSupabase
    .from('matches')
    .select(`
      *,
      skill_level:skill_levels!matches_skill_level_id_fkey (
        *,
        division:divisions!skill_levels_division_id_fkey (
          *,
          season:seasons!divisions_season_id_fkey (
            *,
            organization:organizations!seasons_organization_id_fkey (id)
          )
        )
      )
    `)
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const orgId = match.skill_level?.division?.season?.organization_id

  const { data: coordinator } = await adminSupabase
    .from('coordinators')
    .select('*')
    .eq('profile_id', user.id)
    .eq('organization_id', orgId)
    .single()

  if (!coordinator) {
    return NextResponse.json({ error: 'Only coordinators can delete matches' }, { status: 403 })
  }

  const { error: deleteError } = await adminSupabase
    .from('matches')
    .delete()
    .eq('id', matchId)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}