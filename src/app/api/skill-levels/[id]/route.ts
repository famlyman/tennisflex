import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: skillLevelId } = await params
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

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get skill level with division and season info
  const { data: skillLevel } = await adminSupabase
    .from('skill_levels')
    .select(`
      *,
      division:divisions (
        *,
        season:seasons (
          *,
          organization:organizations!seasons_organization_id_fkey (id, name, slug)
        )
      )
    `)
    .eq('id', skillLevelId)
    .single()

  if (!skillLevel) {
    return NextResponse.json({ error: 'Skill level not found' }, { status: 404 })
  }

  // Check if user is coordinator of this organization
  const orgId = skillLevel.division?.season?.organization_id
  const { data: coordinator } = orgId ? await adminSupabase
    .from('coordinators')
    .select('*')
    .eq('profile_id', user.id)
    .eq('organization_id', orgId)
    .single()
  : { data: null }

  const isCoordinator = !!coordinator

  // Get all matches for this skill level with player info
  const { data: matches, error: matchesError } = await adminSupabase
    .from('matches')
    .select(`
      *,
      home_player:players!matches_home_player_id_fkey (
        id,
        tfr_singles,
        tfr_doubles,
        profile:profiles!players_profile_id_fkey (id, full_name)
      ),
      away_player:players!matches_away_player_id_fkey (
        id,
        tfr_singles,
        tfr_doubles,
        profile:profiles!players_profile_id_fkey (id, full_name)
      )
    `)
    .eq('skill_level_id', skillLevelId)
    .order('created_at', { ascending: false })

  // Determine which rating to use based on division type
  const divisionName = skillLevel.division?.name || ''
  const isDoubles = divisionName.includes('Doubles')
  const ratingField = isDoubles ? 'tfr_doubles' : 'tfr_singles'

  const minRating = skillLevel.min_rating
  const maxRating = skillLevel.max_rating

  // Get all players in this organization
  const { data: players } = await adminSupabase
    .from('players')
    .select(`
      *,
      profile:profiles!players_profile_id_fkey (id, full_name)
    `)
    .eq('organization_id', orgId)

  // Filter players by rating range
  const eligiblePlayers = players?.filter((p: any) => {
    const rating = p[ratingField]
    return rating >= minRating && rating <= maxRating
  }) || []

   // Calculate leaderboard data
   const leaderboard = eligiblePlayers.map((player: any) => {
     const isDoubles = divisionName.includes('Doubles')
     const ratingField = isDoubles ? 'tfr_doubles' : 'tfr_singles'
     const matchCountField = isDoubles ? 'match_count_doubles' : 'match_count_singles'
     
     const playerMatches = matches?.filter((m: any) => 
       (m.home_player_id === player.id || m.away_player_id === player.id) && m.status === 'completed'
     )
     
     let wins = 0
     let losses = 0
     let setsWon = 0
     let setsLost = 0
     
     playerMatches?.forEach((match: any) => {
       const isHome = match.home_player_id === player.id
       const wonMatch = match.winner_id === player.id
       
       if (wonMatch) wins++
       else if (match.winner_id) losses++
       
       // Parse score for sets
       if (match.score) {
         const sets = match.score.split(' ')
         sets.forEach((set: string) => {
           const parts = set.includes('(') ? set.split('(')[0] : set
           const [p1Score, p2Score] = parts.split('-').map(Number)
           
           if (isHome) {
             setsWon += p1Score > p2Score ? 1 : 0
             setsLost += p1Score < p2Score ? 1 : 0
           } else {
             setsWon += p2Score > p1Score ? 1 : 0
             setsLost += p2Score < p1Score ? 1 : 0
           }
         })
       }
     })
     
     return {
       player_id: player.id,
       player_name: player.profile?.full_name || 'Unknown',
       [ratingField]: player[ratingField],
       matches_played: player[matchCountField] || 0,
       wins,
       losses,
       sets_won: setsWon,
       sets_lost: setsLost,
     }
   })

  // Sort by wins (desc), then win percentage, then total matches
  leaderboard.sort((a: any, b: any) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const aWinRate = a.matches_played > 0 ? a.wins / a.matches_played : 0
    const bWinRate = b.matches_played > 0 ? b.wins / b.matches_played : 0
    if (bWinRate !== aWinRate) return bWinRate - aWinRate
    return b.matches_played - a.matches_played
  })

  // Add rank
  leaderboard.forEach((entry: any, index: number) => {
    entry.rank = index + 1
  })

  const matchesWithIds = (matches || []).map((m: any) => ({
    ...m,
    home_player_id: m.home_player_id,
    away_player_id: m.away_player_id,
  }))

  return NextResponse.json({
    skill_level: skillLevel,
    matches: matchesWithIds,
    leaderboard,
    isCoordinator,
    userId: user.id,
  })
}
