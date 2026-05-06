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
    .select('id, type')
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
    .select('player_id, skill_level_id, division_id, partner_id, partner_status')
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
    .select('home_player_id, away_player_id, skill_level_id, home_partner_id, away_partner_id')
    .in('skill_level_id', skillLevelIds)

  const existingPairings = new Set(
    existingMatches?.map(m => {
      // For pairings, we use the primary player IDs as the unique key
      const pair = [m.home_player_id, m.away_player_id].sort()
      return `${m.skill_level_id}:${pair[0]}:${pair[1]}`
    }) || []
  )
  
  // Process each skill level
  for (const skillLevel of skillLevels || []) {
    // Determine if this is a doubles division
    const division = divisions?.find(d => d.id === skillLevel.division_id)
    const isDoubles = division?.type?.includes('doubles')

    // Get registrations for this skill level
    let registrationsInLevel = registrations.filter(r => r.skill_level_id === skillLevel.id)
    
    if (isDoubles) {
      // For doubles, only include registrations that have a confirmed partner
      registrationsInLevel = registrationsInLevel.filter(r => r.partner_id && r.partner_status === 'confirmed')
    }

    if (registrationsInLevel.length < 2) {
      matchesBySkillLevel[skillLevel.id] = 0
      continue
    }

    // Incremental Logic:
    // We want each registration (player or team) to have approx 4 matches total.
    const matchCounts: Record<string, number> = {}
    registrationsInLevel.forEach(reg => {
      matchCounts[reg.player_id] = (existingMatches || []).filter(m => 
        m.skill_level_id === skillLevel.id && (m.home_player_id === reg.player_id || m.away_player_id === reg.player_id)
      ).length
    })

    const targetMatches = 4
    const newMatchesForLevel = []

    // Shuffle for fair distribution
    const shuffledRegs = shuffle(registrationsInLevel, baseSeed)

    for (const r1 of shuffledRegs) {
      if (matchCounts[r1.player_id] >= targetMatches) continue

      // Find potential opponents for r1
      const potentialOpponents = shuffledRegs
        .filter(r2 => r2.player_id !== r1.player_id) 
        .filter(r2 => {
          // Not already matched
          const pair = [r1.player_id, r2.player_id].sort()
          return !existingPairings.has(`${skillLevel.id}:${pair[0]}:${pair[1]}`)
        })
        .sort((a, b) => (matchCounts[a.player_id] || 0) - (matchCounts[b.player_id] || 0))

      for (const r2 of potentialOpponents) {
        if (matchCounts[r1.player_id] >= targetMatches) break
        if (matchCounts[r2.player_id] >= targetMatches) continue

        // Create match object
        newMatchesForLevel.push({
          skill_level_id: skillLevel.id,
          home_player_id: r1.player_id,
          home_partner_id: r1.partner_id,
          away_player_id: r2.player_id,
          away_partner_id: r2.partner_id,
          status: 'scheduled'
        })
        
        // Update local state
        const pair = [r1.player_id, r2.player_id].sort()
        existingPairings.add(`${skillLevel.id}:${pair[0]}:${pair[1]}`)
        matchCounts[r1.player_id]++
        matchCounts[r2.player_id]++
      }
    }
    
    // Create matches in DB
    if (newMatchesForLevel.length > 0) {
      const { error: matchError } = await adminClient
        .from('matches')
        .insert(newMatchesForLevel)
      
      if (!matchError) {
        matchesCreated += newMatchesForLevel.length
      } else {
        console.error('Match creation error:', matchError)
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