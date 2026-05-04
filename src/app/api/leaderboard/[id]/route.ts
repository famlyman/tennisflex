import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: skillLevelId } = await params
  const adminClient = createAdminClient()

  console.log('Leaderboard API called with skillLevelId:', skillLevelId)

  try {
    // First get the skill level and its division
    const { data: skillLevel, error: slError } = await adminClient
      .from('skill_levels')
      .select('*')
      .eq('id', skillLevelId)
      .single()

    if (slError || !skillLevel) {
      console.error('Skill level error:', slError)
      return NextResponse.json({ error: 'Skill level not found', skillLevelId, detail: slError?.message }, { status: 404 })
    }

    console.log('Found skill level:', skillLevel.name)

    // Get the division to find organization_id through season
    const { data: division, error: divError } = await adminClient
      .from('divisions')
      .select('id, name, season_id')
      .eq('id', skillLevel.division_id)
      .single()

    if (divError || !division) {
      console.error('Division error:', divError)
      return NextResponse.json({ error: 'Division not found' }, { status: 404 })
    }

    // Get organization_id from the season
    const { data: season, error: seasonError } = await adminClient
      .from('seasons')
      .select('organization_id')
      .eq('id', division.season_id)
      .single()

    if (seasonError || !season) {
      console.error('Season error:', seasonError)
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const orgId = season.organization_id
    console.log('Found orgId:', orgId)

     // Get registrations for this skill level (include completed for ended seasons)
     const { data: registrations } = await adminClient
       .from('season_registrations')
       .select('player_id')
       .eq('skill_level_id', skillLevelId)
       .in('status', ['active', 'completed'])

    console.log('Found registrations:', registrations?.length)

    // Only include registered players
    const registeredPlayerIds = new Set((registrations || []).map(r => r.player_id))

    if (registeredPlayerIds.size === 0) {
      console.log('No registered players for this skill level')
      return NextResponse.json({ leaderboard: [] })
    }

    const { data: players } = await adminClient
      .from('players')
      .select('id, tfr_singles, tfr_doubles, match_count_singles, match_count_doubles, profile:profiles (full_name)')
      .eq('organization_id', orgId)
      .in('id', Array.from(registeredPlayerIds))

    const divisionName = skillLevel.division?.name || ''
    const isDoubles = divisionName.toLowerCase().includes('doubles')

    // Fetch completed matches for this skill level
    const { data: matches } = await adminClient
      .from('matches')
      .select('id, home_player_id, away_player_id, winner_id, status')
      .eq('skill_level_id', skillLevelId)
      .eq('status', 'completed')

    const leaderboard = (players || []).map((player: any) => {
      const ratingField = isDoubles ? 'tfr_doubles' : 'tfr_singles'
      
      const playerMatches = (matches || []).filter((m: any) => 
        m.home_player_id === player.id || m.away_player_id === player.id
      )
      
      let wins = 0
      let losses = 0
      
      playerMatches.forEach((match: any) => {
        if (match.winner_id === player.id) {
          wins++
        } else if (match.winner_id) {
          losses++
        }
      })
      
      return {
        player_id: player.id,
        player_name: player.profile?.full_name || 'Unknown',
        rating: player[ratingField],
        matches: playerMatches.length,
        wins,
        losses,
      }
    })

    // Sort by wins (desc), then win percentage
    leaderboard.sort((a: any, b: any) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      const aWinRate = a.matches > 0 ? a.wins / a.matches : 0
      const bWinRate = b.matches > 0 ? b.wins / b.matches : 0
      if (bWinRate !== aWinRate) return bWinRate - aWinRate
      return b.matches - a.matches
    })

    leaderboard.forEach((entry: any, index: number) => {
      entry.rank = index + 1
    })

    return NextResponse.json({ 
      leaderboard: leaderboard.slice(0, 20),
      skillLevel: {
        id: skillLevel.id,
        name: skillLevel.name,
      },
      division: {
        id: division.id,
        name: division.name,
      }
    })
  } catch (err: any) {
    console.error('Leaderboard API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}