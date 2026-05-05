import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

// Simple hash for seeding random
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

// Seeded random for reproducibility
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

// Fisher-Yates shuffle with seeded random
function shuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Generate matches where each player plays 4 matches total
// Implementation: 4 rounds, random pairing each round within the skill level
function generateMatchesRoundRobin(players: string[], seed: number): [string, string][] {
  const allPairs: [string, string][] = []
  const rounds = 4
  
  for (let round = 0; round < rounds; round++) {
    const shuffled = shuffle(players, seed + round * 1000)
    
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      allPairs.push([shuffled[i], shuffled[i + 1]])
    }
    // If odd number of players, last player gets a bye (no match this round)
  }
  
  return allPairs
}

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
    return NextResponse.json({ error: 'Only coordinators can generate matches' }, { status: 403 })
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

  // Get skill levels per division
  const { data: skillLevels } = await adminClient
    .from('skill_levels')
    .select('id, division_id, name, min_rating, max_rating')
    .in('division_id', divisionIds)

  // Get registrations for this season
  const { data: registrations } = await adminClient
    .from('season_registrations')
    .select('player_id, skill_level_id, division_id')
    .eq('season_id', seasonId)
    .eq('status', 'active')

  if (!registrations || registrations.length === 0) {
    return NextResponse.json({ error: 'No registered players for this season' }, { status: 400 })
  }

  let matchesCreated = 0
  const matchesBySkillLevel: Record<string, number> = {}

  // Seed from season ID for reproducibility
  const baseSeed = hashString(seasonId)
  
  // Get all existing matches in this season to avoid duplicates
  const skillLevelIds = (skillLevels || []).map(sl => sl.id)
  const { data: existingMatches } = await adminClient
    .from('matches')
    .select('home_player_id, away_player_id, skill_level_id')
    .in('skill_level_id', skillLevelIds)

  const existingPairings = new Set(
    existingMatches?.map(m => {
      const pair = [m.home_player_id, m.away_player_id].sort()
      return `${m.skill_level_id}:${pair[0]}:${pair[1]}`
    }) || []
  )
  
  // Process each skill level
  for (const skillLevel of skillLevels || []) {
    // Get players registered for this skill level
    const playersInLevel = registrations
      .filter(r => r.skill_level_id === skillLevel.id)
      .map(r => r.player_id)
    
    if (playersInLevel.length < 2) {
      matchesBySkillLevel[skillLevel.id] = 0
      continue
    }

    // Incremental Logic:
    // We want each player to have approx 4 matches total.
    // 1. Count how many matches each player currently has
    const playerMatchCounts: Record<string, number> = {}
    playersInLevel.forEach(pid => {
      playerMatchCounts[pid] = (existingMatches || []).filter(m => 
        m.skill_level_id === skillLevel.id && (m.home_player_id === pid || m.away_player_id === pid)
      ).length
    })

    const targetMatches = 4
    const newMatchesForLevel: [string, string][] = []

    // 2. Try to fill up to targetMatches for players who are short
    // We shuffle players to ensure fair distribution for who gets matched first
    const shuffledPlayers = shuffle(playersInLevel, baseSeed)

    for (const p1 of shuffledPlayers) {
      if (playerMatchCounts[p1] >= targetMatches) continue

      // Find potential opponents for p1
      const potentialOpponents = shuffledPlayers
        .filter(p2 => p2 !== p1) // Not themselves
        .filter(p2 => {
          // Not already matched in this season
          const pair = [p1, p2].sort()
          return !existingPairings.has(`${skillLevel.id}:${pair[0]}:${pair[1]}`)
        })
        .sort((a, b) => (playerMatchCounts[a] || 0) - (playerMatchCounts[b] || 0)) // Prioritize players with fewest matches

      for (const p2 of potentialOpponents) {
        if (playerMatchCounts[p1] >= targetMatches) break
        if (playerMatchCounts[p2] >= targetMatches) continue

        // Create match
        newMatchesForLevel.push([p1, p2])
        
        // Update local state to avoid duplicates in this run
        const pair = [p1, p2].sort()
        existingPairings.add(`${skillLevel.id}:${pair[0]}:${pair[1]}`)
        playerMatchCounts[p1]++
        playerMatchCounts[p2]++
      }
    }
    
    // Create matches in DB
    for (const [homePlayer, awayPlayer] of newMatchesForLevel) {
      const { error: matchError } = await adminClient
        .from('matches')
        .insert({
          skill_level_id: skillLevel.id,
          home_player_id: homePlayer,
          away_player_id: awayPlayer,
          status: 'scheduled'
        })
      
      if (!matchError) {
        matchesCreated++
      }
    }
    
    matchesBySkillLevel[skillLevel.id] = newMatchesForLevel.length
  }

  // Update season status if still upcoming/registration_open
  if (season.status !== 'active') {
    await adminClient
      .from('seasons')
      .update({ status: 'active' })
      .eq('id', seasonId)
  }

  // Notify all registered players once
  const uniquePlayerProfiles = new Set<string>()
  registrations?.forEach(r => {
    if (r.player_id) uniquePlayerProfiles.add(r.player_id)
  })
  
  for (const playerId of Array.from(uniquePlayerProfiles)) {
    const { data: player } = await adminClient
      .from('players')
      .select('profile_id')
      .eq('id', playerId)
      .single()
    
    if (player?.profile_id) {
      await adminClient.from('notifications').insert({
        user_id: player.profile_id,
        type: 'matches_generated',
        title: 'New Matches Scheduled',
        message: `${matchesCreated} matches have been generated for ${season.name}. Check your season page!`,
        link: `/seasons/${seasonId}`
      })
    }
  }

  return NextResponse.json({
    success: true,
    matchesCreated,
    matchesBySkillLevel,
    playersRegistered: registrations?.length || 0
  })
}