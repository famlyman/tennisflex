import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get skill level with division and season info
  const { data: skillLevel } = await supabase
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

  // Get all matches for this skill level with player info
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      home_player:players!matches_home_player_id_fkey (
        id,
        tfr_singles,
        profile:profiles!players_profile_id_fkey (id, full_name)
      ),
      away_player:players!matches_away_player_id_fkey (
        id,
        tfr_singles,
        profile:profiles!players_profile_id_fkey (id, full_name)
      )
    `)
    .eq('skill_level_id', skillLevelId)
    .order('created_at', { ascending: false })

  // Get all players in this skill level (based on their rating and division type)
  const orgId = skillLevel.division?.season?.organization_id
  const minRating = skillLevel.min_rating
  const maxRating = skillLevel.max_rating

  const { data: players } = await supabase
    .from('players')
    .select(`
      *,
      profile:profiles!players_profile_id_fkey (id, full_name)
    `)
    .eq('organization_id', orgId)

  // Filter players by rating range
  const eligiblePlayers = (players || []).filter((p: any) => {
    const rating = p.tfr_singles
    return rating >= minRating && rating <= maxRating
  })

  // Calculate leaderboard data
  const leaderboard = eligiblePlayers.map((player: any) => {
    const playerMatches = (matches || []).filter((m: any) => 
      (m.home_player_id === player.id || m.away_player_id === player.id) && m.status === 'completed'
    )
    
    let wins = 0
    let losses = 0
    let setsWon = 0
    let setsLost = 0

    playerMatches.forEach((match: any) => {
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
      tfr_singles: player.tfr_singles,
      matches_played: playerMatches.length,
      wins,
      losses,
      sets_won: setsWon,
      sets_lost: setsLost,
    }
  })

  // Sort by wins (desc), then sets difference (desc)
  leaderboard.sort((a: any, b: any) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    const aSetsDiff = a.sets_won - a.sets_lost
    const bSetsDiff = b.sets_won - b.sets_lost
    return bSetsDiff - aSetsDiff
  })

  // Add rank
  leaderboard.forEach((entry: any, index: number) => {
    entry.rank = index + 1
  })

  return NextResponse.json({
    skill_level: skillLevel,
    matches: matches || [],
    leaderboard,
  })
}