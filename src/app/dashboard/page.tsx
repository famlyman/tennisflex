import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'
import NotificationBell from '@/components/NotificationBell'
import YourMatchesCard from '@/components/YourMatchesCard'
import SeasonHub from '@/components/SeasonHub'

interface MatchData {
  id: string
  scheduled_at: string | null
  status: string
  skill_level_name: string
  division_type: string
  opponent_name: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData(userId: string, email?: string | null) {
  const adminClient = createAdminClient()

  // Get user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // 1. Coordinator Check
  const { data: coordinatorOrgs } = await adminClient
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', userId)

  const isCoordinator = coordinatorOrgs && coordinatorOrgs.length > 0
  const orgIds = coordinatorOrgs?.map(c => c.organization_id) || []

  let coordinatorData = {
    organizations: [] as any[],
    seasons: [] as any[],
    playerCount: 0,
    activeSeasonCount: 0,
    totalMatches: 0,
    pendingMatches: 0,
  }

  if (isCoordinator && orgIds.length > 0) {
    const { data: orgs } = await adminClient
      .from('organizations')
      .select('*')
      .in('id', orgIds)
    
    const { data: seasonsData } = await adminClient
      .from('seasons')
      .select(`
        *,
        divisions (id),
        organization:organizations!seasons_organization_id_fkey (name)
      `)
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })

    const { count: playerCount } = await adminClient
      .from('players')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', orgIds)

    const seasonIds = (seasonsData || []).map(s => s.id)
    const divisionRes = seasonIds.length > 0 
      ? await adminClient.from('divisions').select('id').in('season_id', seasonIds)
      : { data: [] }
    const divisionIds = (divisionRes.data || []).map(d => d.id)

    const skillLevelRes = divisionIds.length > 0
      ? await adminClient.from('skill_levels').select('id').in('division_id', divisionIds)
      : { data: [] }
    const skillLevelIds = (skillLevelRes.data || []).map(s => s.id)

    let totalMatches = 0
    if (skillLevelIds.length > 0) {
      const matchRes = await adminClient.from('matches').select('*', { count: 'exact', head: true }).in('skill_level_id', skillLevelIds).eq('status', 'completed')
      totalMatches = matchRes.count || 0
    }

    let pendingMatches = 0
    if (skillLevelIds.length > 0) {
      const pendingRes = await adminClient.from('matches').select('*', { count: 'exact', head: true }).in('skill_level_id', skillLevelIds).neq('status', 'completed')
      pendingMatches = pendingRes.count || 0
    }

    coordinatorData = {
      organizations: orgs || [],
      seasons: seasonsData || [],
      playerCount: playerCount || 0,
      activeSeasonCount: (seasonsData || []).filter(s => s.status === 'active' || s.status === 'registration_open').length,
      totalMatches,
      pendingMatches,
    }
  }

  // 2. Player Data (Always fetch, even for coordinators)
  let playerRegistrations: any[] = []
  let playerMatches: any[] = []
  let leaderboardData: any = null
  let upcomingMatches: MatchData[] = []
  let allOrgSeasons: any[] = []
  let seasonHubData: any = null
  
  const { data: allPlayers } = await adminClient
    .from('players')
    .select('*, organization:organizations(id, name)')
    .eq('profile_id', userId)

  const primaryPlayer = allPlayers && allPlayers.length > 0 ? allPlayers[0] : null
  const playerIds = allPlayers?.map(p => p.id) || []

  // Fetch registrations across ALL linked players + profile + email
  let registrationsQuery = adminClient
    .from('season_registrations')
    .select(`*`)

  const filterParts = [`profile_id.eq.${userId}`]
  if (playerIds.length > 0) {
    playerIds.forEach(id => {
      filterParts.push(`player_id.eq.${id}`)
      filterParts.push(`partner_id.eq.${id}`)
    })
  }
  if (email) filterParts.push(`partner_email.eq.${email}`)
  
  const { data: registrationsRaw } = await registrationsQuery.or(filterParts.join(','))
  
  if (registrationsRaw && registrationsRaw.length > 0) {
    const seasonIds = [...new Set(registrationsRaw.map(r => r.season_id))]
    const divisionIds = [...new Set(registrationsRaw.map(r => r.division_id).filter(Boolean))]
    
    const { data: seasonsData } = await adminClient
      .from('seasons')
      .select(`*, organization:organizations!seasons_organization_id_fkey (name)`)
      .in('id', seasonIds)
    
    const { data: divisionsData } = await adminClient
      .from('divisions')
      .select(`*`)
      .in('id', divisionIds)
    
    playerRegistrations = registrationsRaw.map(reg => ({
      ...reg,
      season: seasonsData?.find(s => s.id === reg.season_id),
      division: divisionsData?.find(d => d.id === reg.division_id)
    }))
  }

  if (playerIds.length > 0) {
    // Fetch all organization seasons (from all organizations user is a player in)
    const orgIdsForPlayer = allPlayers?.map(p => p.organization_id) || []
    const { data: orgSeasons } = await adminClient
      .from('seasons')
      .select(`*, organization:organizations!seasons_organization_id_fkey (id, name)`)
      .in('organization_id', orgIdsForPlayer)
      .order('created_at', { ascending: false })
    allOrgSeasons = orgSeasons || []

    // Fetch matches for ALL player records
    const matchFilter = playerIds.map(id => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(',')
    const { data: matches } = await adminClient
      .from('matches')
      .select(`
        *,
        skill_level:skill_levels!matches_skill_level_id_fkey (
          id, name, division:divisions!skill_levels_division_id_fkey (id, name, type, season_id)
        ),
        home_player:players!matches_home_player_id_fkey (
          id, profile:profiles!players_profile_id_fkey (full_name)
        ),
        away_player:players!matches_away_player_id_fkey (
          id, profile:profiles!players_profile_id_fkey (full_name)
        )
      `)
      .or(matchFilter)
      .order('created_at', { ascending: false })

    playerMatches = (matches || []).map((match: any) => {
      const matchedPlayerId = playerIds.find(id => match.home_player_id === id || match.away_player_id === id)
      const isHome = match.home_player_id === matchedPlayerId
      const opponent = isHome ? match.away_player : match.home_player
      return {
        ...match,
        opponent_name: opponent?.profile?.full_name || 'Unknown'
      }
    })

    upcomingMatches = (matches || [])
      .filter((m: any) => m.status !== 'completed')
      .map((m: any) => {
        const matchedPlayerId = playerIds.find(id => m.home_player_id === id || m.away_player_id === id)
        return {
          id: m.id,
          scheduled_at: m.scheduled_at,
          status: m.status,
          verified_by_opponent: m.verified_by_opponent,
          skill_level_name: m.skill_level?.name,
          skill_level_id: m.skill_level?.id,
          season_id: m.skill_level?.division?.season_id,
          division_type: m.skill_level?.division?.type,
          opponent_name: m.home_player_id === matchedPlayerId 
            ? m.away_player?.profile?.full_name 
            : m.home_player?.profile?.full_name,
        }
      })

    // Season Hub Data - Get current active/completed season
    const currentSeason = (allOrgSeasons || []).find((s: any) => s.status === 'active' || s.status === 'completed')
    
    if (currentSeason) {
      // Get all divisions for this season
      const { data: seasonDivisions } = await adminClient
        .from('divisions')
        .select('id, name, type')
        .eq('season_id', currentSeason.id)
        .order('type', { ascending: true })

      // Get all skill levels for all divisions
      const divisionIds = (seasonDivisions || []).map((d: any) => d.id)
      const { data: skillLevels } = divisionIds.length > 0
        ? await adminClient
            .from('skill_levels')
            .select('id, name, division_id')
            .in('division_id', divisionIds)
            .order('name', { ascending: true })
        : { data: [] }

      // Get season stats
      const skillLevelIds = (skillLevels || []).map((sl: any) => sl.id)
      
      // Total players registered in this season
      const { count: totalPlayers } = await adminClient
        .from('season_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', currentSeason.id)

      // Total matches
      const { count: totalMatches } = skillLevelIds.length > 0
        ? await adminClient
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .in('skill_level_id', skillLevelIds)
        : { count: 0 }

      const { count: completedMatches } = skillLevelIds.length > 0
        ? await adminClient
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .in('skill_level_id', skillLevelIds)
            .eq('status', 'completed')
        : { count: 0 }

      // Find player's current skill level (most recent match or registration)
      let playerSkillLevelId: string | null = null
      const mostRecentMatch = (matches || []).find((m: any) => m.status === 'completed')
      if (mostRecentMatch) {
        playerSkillLevelId = mostRecentMatch.skill_level_id
      } else if (playerRegistrations.length > 0) {
        const activeReg = playerRegistrations.find((r: any) => r.season_id === currentSeason.id && r.skill_level_id)
        if (activeReg) playerSkillLevelId = activeReg.skill_level_id
      }

      seasonHubData = {
        season: currentSeason,
        divisions: seasonDivisions || [],
        skillLevels: skillLevels || [],
        stats: {
          totalPlayers: totalPlayers || 0,
          totalMatches: totalMatches || 0,
          completedMatches: completedMatches || 0,
          pendingMatches: (totalMatches || 0) - (completedMatches || 0),
        },
        playerSkillLevelId,
      }
    }

    // Leaderboard
    // Priority:
    // 1. Skill level of the most recent completed match
    // 2. Skill level of the first active registration
    let targetSkillLevelId: string | null = null
    let targetDivision: any = null
    let targetSeason: any = null
    let targetSkillLevelObj: any = null

    // Find the most recent completed match for this user
    const mostRecentMatch = (matches || []).find((m: any) => m.status === 'completed')
    
    if (mostRecentMatch) {
      targetSkillLevelId = mostRecentMatch.skill_level_id
      targetSkillLevelObj = mostRecentMatch.skill_level
      targetDivision = mostRecentMatch.skill_level?.division
      targetSeason = (allOrgSeasons || []).find(s => s.id === targetDivision?.season_id)
    } else if (playerRegistrations.length > 0) {
      const primaryReg = playerRegistrations[0]
      targetSkillLevelId = primaryReg.skill_level_id
      targetDivision = primaryReg.division
      targetSeason = primaryReg.season
    }

    if (targetSkillLevelId) {
      // Fetch skill level info if we only have the ID
      if (!targetSkillLevelObj) {
        const { data: sl } = await adminClient
          .from('skill_levels')
          .select('id, name, min_rating, max_rating')
          .eq('id', targetSkillLevelId)
          .single()
        targetSkillLevelObj = sl
      }

      if (targetSkillLevelObj) {
        // 1. Get all players for this organization as a base
        const { data: allOrglayers } = await adminClient
          .from('players')
          .select('id, profile:profiles!players_profile_id_fkey(full_name)')
          .eq('organization_id', primaryPlayer?.organization_id || orgIds[0])

        // 2. Get registered player IDs for this skill level
        const { data: registrations } = await adminClient
          .from('season_registrations')
          .select('player_id')
          .eq('skill_level_id', targetSkillLevelId)
          .in('status', ['active', 'completed'])
        
        const registeredPlayerIds = new Set((registrations || []).map(r => r.player_id))
        
        // 3. Filter players who are either registered OR were in the most recent match
        const eligiblePlayers = (allOrglayers || []).filter((p: any) => 
          registeredPlayerIds.has(p.id) || 
          (mostRecentMatch && (mostRecentMatch.home_player_id === p.id || mostRecentMatch.away_player_id === p.id))
        )

        // 4. Fetch ALL completed matches for this skill level
        const { data: skillLevelMatches } = await adminClient
          .from('matches')
          .select('id, home_player_id, away_player_id, winner_id, status')
          .eq('skill_level_id', targetSkillLevelId)
          .eq('status', 'completed')

        const leaderboard = eligiblePlayers.map((p: any) => {
          const pid = p.id
          const pMatches = (skillLevelMatches || []).filter((m: any) => m.home_player_id === pid || m.away_player_id === pid)
          let wins = 0
          let losses = 0
          pMatches.forEach((m: any) => {
            if (m.winner_id === pid) wins++
            else if (m.winner_id) losses++
          })
          
          // Ensure we correctly extract the name from the profile relation
          const profileData = p.profile as any
          const fullName = Array.isArray(profileData) 
            ? profileData[0]?.full_name 
            : profileData?.full_name

          return { 
            player_id: pid, 
            player_name: fullName || 'Unknown Player', 
            wins, 
            losses, 
            matches: pMatches.length 
          }
        })

        // Sort by wins (desc), then win percentage, then total matches
        leaderboard.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins
          const aWinRate = a.matches > 0 ? a.wins / a.matches : 0
          const bWinRate = b.matches > 0 ? b.wins / b.matches : 0
          if (bWinRate !== aWinRate) return bWinRate - aWinRate
          return b.matches - a.matches
        })

        // Find player's rank
        const playerRank = leaderboard.findIndex((entry: any) => playerIds.includes(entry.player_id))
        const playerEntry = playerRank !== -1 ? leaderboard[playerRank] : null

        leaderboardData = {
          division: targetDivision,
          season: targetSeason,
          skillLevel: targetSkillLevelObj,
          leaderboard: leaderboard.slice(0, 10),
          playerRank: playerRank !== -1 ? playerRank + 1 : null,
          playerEntry,
        }
      }
    }
  }

  return {
    profile,
    isCoordinator,
    coordinatorData,
    player: primaryPlayer,
    playerRegistrations,
    playerMatches,
    seasons: allOrgSeasons,
    leaderboardData,
    upcomingMatches,
    seasonHubData,
  }
  
  if (playerIds.length > 0) {
    // Fetch all organization seasons (from all organizations user is a player in)
    const orgIdsForPlayer = allPlayers?.map(p => p.organization_id) || []
    const { data: orgSeasons } = await adminClient
      .from('seasons')
      .select(`*, organization:organizations!seasons_organization_id_fkey (id, name)`)
      .in('organization_id', orgIdsForPlayer)
      .order('created_at', { ascending: false })
    allOrgSeasons = orgSeasons || []

    // Fetch matches for ALL player records
    const matchFilter = playerIds.map(id => `home_player_id.eq.${id},away_player_id.eq.${id}`).join(',')
    const { data: matches } = await adminClient
      .from('matches')
      .select(`
        *,
        skill_level:skill_levels!matches_skill_level_id_fkey (
          id, name, division:divisions!skill_levels_division_id_fkey (id, name, type, season_id)
        ),
        home_player:players!matches_home_player_id_fkey (
          id, profile:profiles!players_profile_id_fkey (full_name)
        ),
        away_player:players!matches_away_player_id_fkey (
          id, profile:profiles!players_profile_id_fkey (full_name)
        )
      `)
      .or(matchFilter)
      .order('created_at', { ascending: false })

    playerMatches = (matches || []).map((match: any) => {
      const matchedPlayerId = playerIds.find(id => match.home_player_id === id || match.away_player_id === id)
      const isHome = match.home_player_id === matchedPlayerId
      const opponent = isHome ? match.away_player : match.home_player
      return {
        ...match,
        opponent_name: opponent?.profile?.full_name || 'Unknown'
      }
    })

    upcomingMatches = (matches || [])
      .filter((m: any) => m.status !== 'completed')
      .map((m: any) => {
        const matchedPlayerId = playerIds.find(id => m.home_player_id === id || m.away_player_id === id)
        return {
          id: m.id,
          scheduled_at: m.scheduled_at,
          status: m.status,
          verified_by_opponent: m.verified_by_opponent,
          skill_level_name: m.skill_level?.name,
          skill_level_id: m.skill_level?.id,
          season_id: m.skill_level?.division?.season_id,
          division_type: m.skill_level?.division?.type,
          opponent_name: m.home_player_id === matchedPlayerId 
            ? m.away_player?.profile?.full_name 
            : m.home_player?.profile?.full_name,
        }
      })

    // Leaderboard
    // Priority:
    // 1. Skill level of the most recent completed match
    // 2. Skill level of the first active registration
    let targetSkillLevelId: string | null = null
    let targetDivision: any = null
    let targetSeason: any = null
    let targetSkillLevelObj: any = null

    // Find the most recent completed match for this user
    const mostRecentMatch = (matches || []).find((m: any) => m.status === 'completed')
    
    if (mostRecentMatch) {
      targetSkillLevelId = mostRecentMatch.skill_level_id
      targetSkillLevelObj = mostRecentMatch.skill_level
      targetDivision = mostRecentMatch.skill_level?.division
      targetSeason = (allOrgSeasons || []).find(s => s.id === targetDivision?.season_id)
    } else if (playerRegistrations.length > 0) {
      const primaryReg = playerRegistrations[0]
      targetSkillLevelId = primaryReg.skill_level_id
      targetDivision = primaryReg.division
      targetSeason = primaryReg.season
    }

    if (targetSkillLevelId) {
      // Fetch skill level info if we only have the ID
      if (!targetSkillLevelObj) {
        const { data: sl } = await adminClient
          .from('skill_levels')
          .select('id, name, min_rating, max_rating')
          .eq('id', targetSkillLevelId)
          .single()
        targetSkillLevelObj = sl
      }

      if (targetSkillLevelObj) {
        // 1. Get all players for this organization as a base
        const { data: allOrglayers } = await adminClient
          .from('players')
          .select('id, profile:profiles!players_profile_id_fkey(full_name)')
          .eq('organization_id', primaryPlayer?.organization_id || orgIds[0])

        // 2. Get registered player IDs for this skill level
        const { data: registrations } = await adminClient
          .from('season_registrations')
          .select('player_id')
          .eq('skill_level_id', targetSkillLevelId)
          .eq('status', 'active')
        
        const registeredPlayerIds = new Set((registrations || []).map(r => r.player_id))
        
        // 3. Filter players who are either registered OR were in the most recent match
        const eligiblePlayers = (allOrglayers || []).filter((p: any) => 
          registeredPlayerIds.has(p.id) || 
          (mostRecentMatch && (mostRecentMatch.home_player_id === p.id || mostRecentMatch.away_player_id === p.id))
        )

        // 4. Fetch ALL completed matches for this skill level
        const { data: skillLevelMatches } = await adminClient
          .from('matches')
          .select('id, home_player_id, away_player_id, winner_id, status')
          .eq('skill_level_id', targetSkillLevelId)
          .eq('status', 'completed')

        const leaderboard = eligiblePlayers.map((p: any) => {
          const pid = p.id
          const pMatches = (skillLevelMatches || []).filter((m: any) => m.home_player_id === pid || m.away_player_id === pid)
          let wins = 0
          let losses = 0
          pMatches.forEach((m: any) => {
            if (m.winner_id === pid) wins++
            else if (m.winner_id) losses++
          })
          
          // Ensure we correctly extract the name from the profile relation
          const profileData = p.profile as any
          const fullName = Array.isArray(profileData) 
            ? profileData[0]?.full_name 
            : profileData?.full_name

          return { 
            player_id: pid, 
            player_name: fullName || 'Unknown Player', 
            wins, 
            losses, 
            matches: pMatches.length 
          }
        })

        // Sort by wins (desc), then win percentage, then total matches
        leaderboard.sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins
          const aWinRate = a.matches > 0 ? a.wins / a.matches : 0
          const bWinRate = b.matches > 0 ? b.wins / b.matches : 0
          if (bWinRate !== aWinRate) return bWinRate - aWinRate
          return b.matches - a.matches
        })

        leaderboardData = {
          division: targetDivision,
          season: targetSeason,
          skillLevel: targetSkillLevelObj,
          leaderboard: leaderboard.slice(0, 10),
        }
      }
    }
  }

  return {
    profile,
    isCoordinator,
    coordinatorData,
    player: primaryPlayer,
    playerRegistrations,
    playerMatches,
    seasons: allOrgSeasons,
    leaderboardData,
    upcomingMatches,
  }
}

export default async function Dashboard() {
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
    redirect('/login')
  }

  const dashboardData = await getDashboardData(user.id, user.email)
  const fullName = dashboardData.profile?.full_name || user.user_metadata?.full_name || 'User'
  const isCoordinator = dashboardData.isCoordinator
  const isPlatformOwner = dashboardData.profile?.role === 'platform_owner'

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl text-gray-600 tracking-tight">Tennis-Flex</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-slate-600">{fullName}</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isPlatformOwner 
                ? 'bg-red-100 text-red-700' 
                : isCoordinator 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-indigo-100 text-indigo-700'
            }`}>
              {isPlatformOwner ? 'Admin' : isCoordinator ? 'Coordinator' : 'Player'}
            </span>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {fullName}!</h1>
          <p className="text-slate-600 mt-1">
            {isCoordinator 
              ? 'Manage your seasons and track your own play from here.' 
              : 'Browse seasons and track your TFR ratings.'}
          </p>
        </div>
        
        {/* Season Hub Section - For Players */}
        {dashboardData.seasonHubData && !isCoordinator && (
          <SeasonHub 
            data={dashboardData.seasonHubData}
            playerId={dashboardData.player?.id}
            playerTfr={dashboardData.player?.tfr_singles}
            playerMatches={dashboardData.player?.match_count_singles}
          />
        )}

        {/* Coordinator Stats Section */}
        {isCoordinator && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Active Seasons</h3>
              <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.coordinatorData.activeSeasonCount}</p>
              <p className="text-sm text-slate-500">running</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Total Players</h3>
              <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.coordinatorData.playerCount}</p>
              <p className="text-sm text-slate-500">registered</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Matches Played</h3>
              <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.coordinatorData.totalMatches}</p>
              <p className="text-sm text-slate-500">completed</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-amber-600 mb-1">{dashboardData.coordinatorData.pendingMatches}</p>
              <p className="text-sm text-slate-500">awaiting scores</p>
            </div>
          </div>
        )}

        {/* Player Section (Visible to both Players and Coordinators who play) */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Your TFR Rating</h3>
            <p className="text-sm text-slate-500 mb-4">Singles • Doubles</p>
            <div className="flex gap-8">
              <div>
                <p className="text-3xl font-bold text-indigo-600">
                  {dashboardData.player?.tfr_singles ? Math.round(dashboardData.player.tfr_singles) : '--'}
                </p>
                <p className="text-xs text-slate-500">Singles</p>
                <p className="text-xs text-slate-400">
                  {dashboardData.player?.initial_ntrp_singles ? `NTRP: ${dashboardData.player.initial_ntrp_singles}` : ''}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-indigo-600">
                  {dashboardData.player?.tfr_doubles ? Math.round(dashboardData.player.tfr_doubles) : '--'}
                </p>
                <p className="text-xs text-slate-500">Doubles</p>
                <p className="text-xs text-slate-400">
                  {dashboardData.player?.initial_ntrp_doubles ? `NTRP: ${dashboardData.player.initial_ntrp_doubles}` : ''}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              {dashboardData.player?.match_count_singles || 0} matches played
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Leaderboard</h3>
              <Link href="/leaderboard" className="text-sm text-indigo-600 hover:underline">Full →</Link>
            </div>
            {dashboardData.leaderboardData ? (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  {dashboardData.leaderboardData.season?.name} • {dashboardData.leaderboardData.division?.name || dashboardData.leaderboardData.division?.type?.replace('_', ' ')}
                </p>
                <p className="text-sm font-medium text-indigo-600 mb-3">{dashboardData.leaderboardData.skillLevel?.name}</p>
                <div className="space-y-1">
                  {dashboardData.leaderboardData.leaderboard?.slice(0, 5).map((entry: any, idx: number) => (
                    <div key={entry.player_id} className="flex items-center gap-2 text-sm">
                      <span className={`w-5 text-center font-medium ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>{idx + 1}</span>
                      <span className="flex-1 truncate text-slate-900 font-medium">{entry.player_name}</span>
                      <span className="text-slate-500">{entry.wins}W-{entry.losses}L</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Join a season to appear on the leaderboard!</p>
            )}
          </div>

          {dashboardData.playerRegistrations.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Your Registrations</h3>
                <Link href="/seasons" className="text-sm text-indigo-600 hover:underline">More →</Link>
              </div>
              <div className="space-y-3">
                {dashboardData.playerRegistrations.map((reg: any) => (
                  <div key={reg.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{reg.season?.name}</p>
                        <p className="text-xs text-slate-500">{reg.division?.name || reg.division?.type?.replace('_', ' ')}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${reg.season?.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {reg.season?.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player Matches Card */}
        {dashboardData.playerMatches && dashboardData.playerMatches.length > 0 && (
          <div className="mb-8">
            <YourMatchesCard matches={dashboardData.playerMatches} playerId={dashboardData.player?.id} />
          </div>
        )}

        {/* Coordinator Seasons List */}
        {isCoordinator && dashboardData.coordinatorData.seasons.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Manage Seasons</h2>
            <div className="space-y-3">
              {dashboardData.coordinatorData.seasons.map((season: any) => (
                <div key={season.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900">{season.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${season.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {season.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{season.organization?.name || 'Unknown'} • {season.divisions?.length || 0} divisions</p>
                  </div>
                  <Link href={`/seasons/${season.id}`} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">View</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Available Seasons List */}
        {!isCoordinator && dashboardData.seasons.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Available Seasons</h2>
            <div className="space-y-3">
              {dashboardData.seasons.map((season: any) => {
                const isOpen = season.status === 'registration_open'
                return (
                  <div key={season.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-900">{season.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${season.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isOpen ? 'Registration Open' : season.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{season.organization?.name}</p>
                    </div>
                    {isOpen ? (
                      <Link href={`/seasons/${season.id}/register`} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Register</Link>
                    ) : (
                      <Link href={`/seasons/${season.id}`} className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">View</Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions (Combined) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {isPlatformOwner && (
              <Link href="/admin/chapters" className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <p className="font-semibold text-slate-900">Manage Flexes</p>
                <p className="text-sm text-slate-500">Approve/deny Flex requests</p>
              </Link>
            )}
            
            {isCoordinator && (
              <>
                <Link href="/seasons/create" className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <p className="font-semibold text-slate-900">Create Season</p>
                  <p className="text-sm text-slate-500">Start a new season</p>
                </Link>
                <Link href="/flags" className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21a2 2 0 012 2v16m-13 0h6m-6 0a1 1 0 001 1h4a1 1 0 001-1m-7 0a1 1 0 011-1h2a1 1 0 011 1m-7 0h6M5 5v4h4V5H5z" /></svg>
                  </div>
                  <p className="font-semibold text-slate-900">Review Flags</p>
                  <p className="text-sm text-slate-500">Anti-sandbagging reports</p>
                </Link>
              </>
            )}

            <Link href="/seasons" className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="font-semibold text-slate-900">Browse Seasons</p>
              <p className="text-sm text-slate-500">Find a league near you</p>
            </Link>
            
            <Link href="/profile" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <p className="font-semibold text-slate-900">Edit Profile</p>
              <p className="text-sm text-slate-500">Update your NTRP ratings</p>
            </Link>

            <Link href="/leaderboard" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <p className="font-semibold text-slate-900">Leaderboards</p>
              <p className="text-sm text-slate-500">View current standings</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}