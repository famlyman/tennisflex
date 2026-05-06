import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
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

  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get season details
  const { data: season } = await adminClient
    .from('seasons')
    .select('*, organization_id')
    .eq('id', seasonId)
    .single()

  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 })
  }

  // Check coordinator
  const { data: coordinator } = await adminClient
    .from('coordinators')
    .select('id')
    .eq('profile_id', user.id)
    .eq('organization_id', season.organization_id)
    .single()

  if (!coordinator) {
    return NextResponse.json({ error: 'Only coordinators can complete seasons' }, { status: 403 })
  }

  // Get all divisions and skill levels for this season
  const { data: divisions } = await adminClient
    .from('divisions')
    .select('id')
    .eq('season_id', seasonId)

  const divisionIds = divisions?.map(d => d.id) || []
  
  if (divisionIds.length === 0) {
    return NextResponse.json({ error: 'No divisions in this season' }, { status: 400 })
  }

  // Get skill levels
  const { data: skillLevels } = await adminClient
    .from('skill_levels')
    .select('id, division_id')
    .in('division_id', divisionIds)

  const skillLevelIds = skillLevels?.map(s => s.id) || []

  // 1. Auto-mark incomplete matches as forfeited
  const today = new Date().toISOString()
  const { data: expiredMatches } = await adminClient
    .from('matches')
    .update({ status: 'forfeited' })
    .eq('season_id', seasonId)
    .in('skill_level_id', skillLevelIds)
    .neq('status', 'completed')
    .neq('status', 'forfeited')
    .select('id')

  // 2. Update season_registrations status
  await adminClient
    .from('season_registrations')
    .update({ status: 'completed' })
    .eq('season_id', seasonId)
    .eq('status', 'active')

  // 3. Generate standings for each skill level
  const standings: Record<string, any[]> = {}

  for (const skillLevelId of skillLevelIds) {
    const { data: matches } = await adminClient
      .from('matches')
      .select('home_player_id, away_player_id, winner_id, score, status')
      .eq('skill_level_id', skillLevelId)
      .eq('status', 'completed')

    const playerStats: Record<string, { wins: number; losses: number; setsW: number; setsL: number }> = {}

    for (const match of matches || []) {
      if (!match.home_player_id || !match.away_player_id) continue
      
      // Initialize both players
      if (!playerStats[match.home_player_id]) {
        playerStats[match.home_player_id] = { wins: 0, losses: 0, setsW: 0, setsL: 0 }
      }
      if (!playerStats[match.away_player_id]) {
        playerStats[match.away_player_id] = { wins: 0, losses: 0, setsW: 0, setsL: 0 }
      }

      // Parse score
      if (match.score) {
        const sets = match.score.split(' ')
        sets.forEach((set: string) => {
          const parts = set.includes('(') ? set.split('(')[0] : set
          const [h, a] = parts.split('-').map(Number)
          if (match.home_player_id && playerStats[match.home_player_id]) {
            if (h > a) playerStats[match.home_player_id].setsW++
            else playerStats[match.home_player_id].setsL++
          }
          if (match.away_player_id && playerStats[match.away_player_id]) {
            if (a > h) playerStats[match.away_player_id].setsW++
            else playerStats[match.away_player_id].setsL++
          }
        })
      }

      // Update wins/losses
      if (match.winner_id === match.home_player_id) {
        playerStats[match.home_player_id].wins++
        playerStats[match.away_player_id].losses++
      } else if (match.winner_id === match.away_player_id) {
        playerStats[match.away_player_id].wins++
        playerStats[match.home_player_id].losses++
      }
    }

    // Sort by wins, then win percentage, then total matches
    const sorted = Object.entries(playerStats)
      .map(([playerId, stats]) => ({ 
        playerId, 
        ...stats, 
        matches: stats.wins + stats.losses 
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        const aWinRate = a.matches > 0 ? a.wins / a.matches : 0
        const bWinRate = b.matches > 0 ? b.wins / b.matches : 0
        if (bWinRate !== aWinRate) return bWinRate - aWinRate
        return b.matches - a.matches
      })

    standings[skillLevelId] = sorted

    // 3.1 Award the winner
    if (sorted.length > 0) {
      const winner = sorted[0];
      // Only award if they have at least one win
      if (winner.wins > 0) {
        await adminClient.from('awards').upsert({
          player_id: winner.playerId,
          season_id: seasonId,
          skill_level_id: skillLevelId,
          award_type: 'winner',
          title: `${season.name} Winner`
        }, { onConflict: 'player_id,season_id,award_type' });
      }
    }
  }

  // 4. Update season status to completed
  const { error: updateError } = await adminClient
    .from('seasons')
    .update({ status: 'completed' })
    .eq('id', seasonId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 5. Notify all registered players
  const { data: registrations } = await adminClient
    .from('season_registrations')
    .select('player_id')
    .eq('season_id', seasonId)
    .eq('status', 'completed')

  const registrationPlayerIds = registrations?.map((r: any) => r.player_id) || []
  
  const { data: players } = await adminClient
    .from('players')
    .select('id, profile_id')
    .in('id', registrationPlayerIds)

  for (const player of players || []) {
    await adminClient.from('notifications').insert({
      user_id: player.profile_id,
      type: 'season_completed',
      title: `${season.name} Completed`,
      message: `The season has ended. Check the leaderboard for final standings!`,
      link: `/seasons/${seasonId}`
    })
  }

  return NextResponse.json({
    success: true,
    expiredMatchesCount: expiredMatches?.length || 0,
    standings
  })
}