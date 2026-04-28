import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

interface RouteParams {
  id: string
}

function parseScore(score: string): { homeSets: number; awaySets: number; totalSets: number } {
  const sets = score.split(' ')
  let homeSets = 0
  let awaySets = 0
  
  sets.forEach(set => {
    const parts = set.includes('(') ? set.split('(')[0] : set
    const [h, a] = parts.split('-').map(Number)
    if (h > a) homeSets++
    else if (a > h) awaySets++
  })
  
  return { homeSets, awaySets, totalSets: sets.length }
}

function calculateExpectedRating(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

function getKFactor(matchCount: number, ratingDeviation: number): number {
  if (ratingDeviation > 50) return 40
  if (matchCount < 10) return 32
  if (matchCount < 30) return 24
  return 16
}

// Calculate TFR point change based on result and score differential
function calculateTfrChange(
  playerRating: number,
  opponentRating: number,
  won: boolean,
  score: string,
  kFactor: number
): number {
  const expected = calculateExpectedRating(playerRating, opponentRating)
  
  // Determine if it was a blowout (6-0, 6-1, 6-2) or close (6-4, 7-5, etc.)
  const sets = score.split(' ')
  let totalDiff = 0
  let validSets = 0
  
  sets.forEach(set => {
    const parts = set.includes('(') ? set.split('(')[0] : set
    const [p1, p2] = parts.split('-').map(Number)
    if (!isNaN(p1) && !isNaN(p2)) {
      totalDiff += Math.abs(p1 - p2)
      validSets++
    }
  })
  
  const avgDiff = validSets > 0 ? totalDiff / validSets : 2
  const isBlowout = avgDiff >= 4  // 6-2 or worse
  
  if (won) {
    // Win: +0.3 to +1.0 for expected, +0.5 to +3.0 for upset
    const baseWin = opponentRating > playerRating ? 1.0 : 0.5
    const upsetBonus = opponentRating > playerRating ? Math.min(2.0, (opponentRating - playerRating) / 10) : 0
    return (baseWin + upsetBonus) * (isBlowout ? 1.5 : 1.0)
  } else {
    // Loss: -0.2 to -0.3 for close, -0.5 to -1.0 for blowout
    return isBlowout ? -(0.5 + Math.random() * 0.5) : -(0.2 + Math.random() * 0.1)
  }
}

async function updatePlayerRatings(
  adminSupabase: any,
  homePlayerId: string,
  awayPlayerId: string,
  winnerId: string | null,
  score: string,
  divisionType: string
) {
  const isSingles = divisionType?.includes('singles') || !divisionType?.includes('doubles')
  
  const { data: homePlayer } = await adminSupabase
    .from('players')
    .select('id, profile_id, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles')
    .eq('id', homePlayerId)
    .single()
    
  const { data: awayPlayer } = await adminSupabase
    .from('players')
    .select('id, profile_id, tfr_singles, tfr_doubles, rating_deviation, match_count_singles, match_count_doubles')
    .eq('id', awayPlayerId)
    .single()
  
  if (!homePlayer || !awayPlayer) return
  
  const ratingField = isSingles ? 'tfr_singles' : 'tfr_doubles'
  const matchCountField = isSingles ? 'match_count_singles' : 'match_count_doubles'
  
  const homeRating = homePlayer[ratingField] || 35
  const awayRating = awayPlayer[ratingField] || 35
  
  const homeRD = homePlayer.rating_deviation || 4
  const awayRD = awayPlayer.rating_deviation || 4
  
  const homeMatchCount = homePlayer[matchCountField] || 0
  const awayMatchCount = awayPlayer[matchCountField] || 0
  
  // Use TFR point system
  const homeTfrChange = calculateTfrChange(homeRating, awayRating, winnerId === homePlayerId, score, getKFactor(homeMatchCount, homeRD))
  const awayTfrChange = calculateTfrChange(awayRating, homeRating, winnerId === awayPlayerId, score, getKFactor(awayMatchCount, awayRD))
  
  let newHomeRating = homeRating + homeTfrChange
  let newAwayRating = awayRating + awayTfrChange
  
  newHomeRating = Math.max(10, Math.min(80, newHomeRating))
  newAwayRating = Math.max(10, Math.min(80, newAwayRating))
  
  const newHomeRD = Math.max(3, homeRD - 2)
  const newAwayRD = Math.max(3, awayRD - 2)
  
  await adminSupabase
    .from('players')
    .update({
      [ratingField]: newHomeRating,
      rating_deviation: newHomeRD,
      [matchCountField]: homeMatchCount + 1
    })
    .eq('id', homePlayerId)
  
  await adminSupabase
    .from('players')
    .update({
      [ratingField]: newAwayRating,
      rating_deviation: newAwayRD,
      [matchCountField]: awayMatchCount + 1
    })
    .eq('id', awayPlayerId)
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
          type,
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

  const divisionType = match.skill_level?.division?.type

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

  if (match.home_player_id && match.away_player_id) {
    await updatePlayerRatings(
      adminSupabase,
      match.home_player_id,
      match.away_player_id,
      winner_id,
      score,
      divisionType
    )
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