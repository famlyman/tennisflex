import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/utils/supabase'
import { cookies } from 'next/headers'
 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('player_id')
  const seasonId = searchParams.get('season_id')
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
 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
 
  // Get player's record in their organization
  const { data: player } = await supabase
    .from('players')
    .select('id, organization_id, tfr_singles, tfr_doubles, match_count_singles')
    .eq('profile_id', user.id)
    .maybeSingle()
 
  if (!player) {
    return NextResponse.json({
      stats: { wins: 0, losses: 0 },
      recentMatches: [],
      ratingMove: null
    })
  }
 
  // Get completed matches
  const { data: homeMatches } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      score,
      winner_id,
      home_player_id,
      away_player_id,
      created_at,
      skill_level:skill_levels!matches_skill_level_id_fkey (
        name,
        division:divisions!skill_levels_division_id_fkey (
          name,
          season:seasons!divisions_season_id_fkey (name)
        )
      )
    `)
    .eq('home_player_id', player.id)
    .eq('status', 'completed')
 
  const { data: awayMatches } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      score,
      winner_id,
      home_player_id,
      away_player_id,
      created_at,
      skill_level:skill_levels!matches_skill_level_id_fkey (
        name,
        division:divisions!skill_levels_division_id_fkey (
          name,
          season:seasons!divisions_season_id_fkey (name)
        )
      )
    `)
    .eq('away_player_id', player.id)
    .eq('status', 'completed')
 
  // Combine and calculate stats
  const allMatches = [...(homeMatches || []), ...(awayMatches || [])]
  // Sort by most recent first
  allMatches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
 
  let wins = 0
  let losses = 0
 
  allMatches.forEach((m: any) => {
    const iWon = m.winner_id === player.id
    if (iWon) wins++
    else if (m.winner_id) losses++
  })
 
  const recentMatches = allMatches.slice(0, 10).map((m: any) => {
    const isHome = m.home_player_id === player.id
    const iWon = m.winner_id === player.id
    
    return {
      id: m.id,
      score: m.score,
      won: iWon,
      opponent: isHome ? 'Away' : 'Home',
      skillLevel: m.skill_level?.name,
      seasonName: m.skill_level?.division?.season?.name
    }
  })
 
  // Calculate rating move if season specified
  let ratingMove = null
  if (playerId && seasonId) {
    const adminClient = createAdminClient()
    // Get player's matches in this season
    const { data: seasonMatches } = await adminClient
      .from('matches')
      .select(`
        id,
        winner_id,
        home_player_id,
        away_player_id,
        skill_level:skill_levels!matches_skill_level_id_fkey (
          division:divisions!skill_levels_division_id_fkey (season_id)
        )
      `)
      .or(`home_player_id.eq.${playerId},away_player_id.eq.${playerId}`)
      .eq('status', 'completed')
    
    const seasonMatchCount = (seasonMatches || []).filter((m: any) => 
      m.skill_level?.division?.season_id === seasonId
    ).length

    if (seasonMatchCount >= 3) {
      ratingMove = {
        playerId,
        playerName: user.user_metadata?.full_name || 'You',
        oldRating: Math.round(player.tfr_singles - 5), // Approximate old rating
        newRating: Math.round(player.tfr_singles),
        matches: seasonMatchCount
      }
    }
  }
 
  return NextResponse.json({
    stats: { wins, losses },
    recentMatches,
    ratingMove
  })
}