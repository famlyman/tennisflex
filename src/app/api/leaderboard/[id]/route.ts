import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: skillLevelId } = await params
  const adminClient = createAdminClient()

  try {
    // First get the skill level and its division
    const { data: skillLevel, error: slError } = await adminClient
      .from('skill_levels')
      .select('*')
      .eq('id', skillLevelId)
      .single()

    if (slError || !skillLevel) {
      console.error('Skill level error:', slError)
      return NextResponse.json({ error: 'Skill level not found', detail: slError?.message }, { status: 404 })
    }

    // Get the division to find organization_id
    const { data: division, error: divError } = await adminClient
      .from('divisions')
      .select('season_id, organization_id')
      .eq('id', skillLevel.division_id)
      .single()

    if (divError || !division) {
      console.error('Division error:', divError)
      return NextResponse.json({ error: 'Division not found' }, { status: 404 })
    }

    const orgId = division.organization_id

    const { data: matches } = await adminClient
      .from('matches')
      .select('id, home_player_id, away_player_id, winner_id, status')
      .eq('skill_level_id', skillLevelId)
      .eq('status', 'completed')

    const { data: players } = await adminClient
      .from('players')
      .select('id, tfr_singles, profile:profiles (full_name)')
      .eq('organization_id', orgId)

    const minRating = skillLevel.min_rating
    const maxRating = skillLevel.max_rating

    const eligiblePlayers = (players || []).filter((p: any) => {
      if (!minRating || !maxRating) return true
      return p.tfr_singles >= minRating && p.tfr_singles <= maxRating
    })

    const leaderboard = eligiblePlayers.map((player: any) => {
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
        wins,
        losses,
        matches: playerMatches.length,
      }
    })

    leaderboard.sort((a: any, b: any) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.matches - a.matches
    })

    leaderboard.forEach((entry: any, index: number) => {
      entry.rank = index + 1
    })

    return NextResponse.json({ leaderboard: leaderboard.slice(0, 20) })
  } catch (err: any) {
    console.error('Leaderboard API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}