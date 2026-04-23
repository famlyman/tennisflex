import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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
    .select('id, organization_id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!player) {
    return NextResponse.json({
      stats: { wins: 0, losses: 0 },
      recentMatches: []
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
      skill_level:skill_levels!matches_skill_level_id_fkey (
        name,
        division:distions!skill_levels_division_id_fkey (
          name,
          season:seasons!divisions_season_id_fkey (name)
        )
      )
    `)
    .eq('away_player_id', player.id)
    .eq('status', 'completed')

  // Combine and calculate stats
  const allMatches = [...(homeMatches || []), ...(awayMatches || [])]
  let wins = 0
  let losses = 0

  const recentMatches = allMatches.slice(0, 10).map((m: any) => {
    const isHome = m.home_player_id === player.id
    const iWon = m.winner_id === player.id
    
    if (iWon) wins++
    else if (m.winner_id) losses++

    return {
      id: m.id,
      score: m.score,
      won: iWon,
      opponent: isHome ? 'Home' : 'Away',
      skillLevel: m.skill_level?.name,
      seasonName: m.skill_level?.division?.season?.name
    }
  })

  return NextResponse.json({
    stats: { wins, losses },
    recentMatches
  })
}