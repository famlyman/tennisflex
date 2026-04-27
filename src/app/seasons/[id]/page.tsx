import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CoordinatorActionButton from '@/components/CoordinatorActionButton'
import { createAdminClient } from '@/utils/supabase'

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Get user's orgs (for coordinators)
  const { data: coordinatorOrgs } = await supabase
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', session.user.id)

  let orgIds = coordinatorOrgs?.map(c => c.organization_id) || []

  // Also check if user is a player in any organization
  const { data: player } = await supabase
    .from('players')
    .select('organization_id')
    .eq('profile_id', session.user.id)
    .single()

  if (player) {
    orgIds = [...orgIds, player.organization_id]
  }

  // Query each org separately
  let allSeasons: any[] = []
  const seenSeasonIds = new Set()
  
  for (const orgId of orgIds) {
    const { data: orgSeasons } = await supabase
      .from('seasons')
      .select('*')
      .eq('organization_id', orgId)
    
    if (orgSeasons) {
      for (const s of orgSeasons) {
        if (!seenSeasonIds.has(s.id)) {
          seenSeasonIds.add(s.id)
          allSeasons.push(s)
        }
      }
    }
  }

  // Find the season with matching ID
  const season = allSeasons.find(s => s.id === seasonId)
  
  if (!season) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-500 mb-4">Season not found or access denied</div>
          <div className="text-sm text-slate-400">Your orgs: {orgIds.join(', ')}</div>
        </div>
      </div>
    )
  }

  // Get divisions separately
  const adminClient = createAdminClient()
  const { data: divisions } = await adminClient
    .from('divisions')
    .select('*')
    .eq('season_id', seasonId)

  // Get skill levels for all divisions
  const divisionIds = divisions?.map(d => d.id) || []
  const { data: skillLevels } = await adminClient
    .from('skill_levels')
    .select('*')
    .in('division_id', divisionIds)

  // Get matches for all skill levels in this season
  const skillLevelIds = skillLevels?.map(sl => sl.id) || []

  let matches: any[] = []
  if (skillLevelIds.length > 0) {
    const { data: matchesData } = await adminClient
      .from('matches')
      .select('id, skill_level_id, home_player_id, away_player_id, status, score, winner_id')
      .in('skill_level_id', skillLevelIds)
    matches = matchesData || []
  }

  // Get season stats
  const { data: registrationsData } = await adminClient
    .from('season_registrations')
    .select('id')
    .eq('season_id', seasonId)
    .eq('status', 'active')

  const totalPlayers = registrationsData?.length || 0
  const totalMatches = matches.length
  const completedMatches = matches.filter(m => m.status === 'completed').length
  const pendingMatches = matches.filter(m => m.status === 'scheduled').length
  
  const seasonStart = new Date(season.season_start)
  const seasonEnd = new Date(season.season_end)
  const today = new Date()
  const totalDays = Math.ceil((seasonEnd.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed = Math.ceil((today.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, Math.ceil((seasonEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const progressPercent = season.status === 'active' ? Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100))) : 0

  // Get player profile names
  const playerIds = new Set<string>()
  matches.forEach(m => {
    if (m.home_player_id) playerIds.add(m.home_player_id)
    if (m.away_player_id) playerIds.add(m.away_player_id)
  })
  
  let profileMap = new Map()
  if (playerIds.size > 0) {
    const { data: playerProfiles } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(playerIds))
    profileMap = new Map(playerProfiles?.map(p => [p.id, p.full_name]) || [])
  }

  // Get player names from players table
  const { data: playerData } = await adminClient
    .from('players')
    .select('id, profile_id')
    .in('id', Array.from(playerIds))
  
  const playerToProfile = new Map(playerData?.map(p => [p.id, p.profile_id]) || [])

  // Attach matches to skill levels
  const skillLevelsWithMatches = skillLevels?.map(sl => ({
    ...sl,
    matches: matches.filter(m => m.skill_level_id === sl.id).map(m => {
      const homeProfileId = playerToProfile.get(m.home_player_id)
      const awayProfileId = playerToProfile.get(m.away_player_id)
      return {
        ...m,
        home_player_name: homeProfileId ? profileMap.get(homeProfileId) || 'Unknown' : 'TBD',
        away_player_name: awayProfileId ? profileMap.get(awayProfileId) || 'Unknown' : 'TBD',
      }
    })
  })) || []

  // Attach skill levels to divisions
  const divisionsWithLevels = divisions?.map(div => ({
    ...div,
    skill_levels: skillLevelsWithMatches.filter(sl => sl.division_id === div.id)
  })) || []

  const seasonWithDivisions = { ...season, divisions: divisionsWithLevels }

  if (!season) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-500 mb-4">Season not found or access denied</div>
          <div className="text-sm text-slate-400">Your orgs: {orgIds.join(', ')}</div>
          <div className="text-sm text-slate-400">Available seasons: {allSeasons.length}</div>
          <div className="text-sm text-slate-400">Querying orgs individually...</div>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    upcoming: 'bg-slate-100 text-slate-600',
    registration_open: 'bg-emerald-100 text-emerald-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-200 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    upcoming: 'Coming Soon',
    registration_open: 'Registration Open',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  const isCoordinator = orgIds.includes(season.organization_id)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Tennis-Flex</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/seasons" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
          ← Back to Seasons
        </Link>

        {/* Season Header Card */}
        <div className={`rounded-2xl p-6 shadow-sm border mb-6 ${season.status === 'active' ? 'bg-gradient-to-r from-blue-600 to-indigo-700 border-blue-500 text-white' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className={`text-3xl font-bold ${season.status === 'active' ? 'text-white' : 'text-slate-900'}`}>{season.name}</h1>
              <p className={`mt-1 ${season.status === 'active' ? 'text-blue-100' : 'text-slate-500'}`}>{season.organization?.name}</p>
              {season.description && (
                <p className={`mt-2 whitespace-pre-wrap ${season.status === 'active' ? 'text-blue-50' : 'text-slate-600'}`}>{season.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${season.status === 'active' ? 'bg-white/20 text-white backdrop-blur-sm' : statusColors[season.status] || statusColors.upcoming}`}>
                {statusLabels[season.status] || season.status}
              </span>
              {isCoordinator && season.status === 'upcoming' && (
                <div className="flex gap-2 mt-2">
                  <CoordinatorActionButton action="open-registration" seasonId={seasonId} variant="green">
                    Open Registration
                  </CoordinatorActionButton>
                  <CoordinatorActionButton action="start" seasonId={seasonId} variant="blue">
                    Start Season Now
                  </CoordinatorActionButton>
                </div>
              )}
              {isCoordinator && season.status === 'registration_open' && (
                <CoordinatorActionButton action="close-registration" seasonId={seasonId} variant="amber">
                  Close Registration & Start
                </CoordinatorActionButton>
              )}
              {isCoordinator && season.status === 'active' && (
                <div className="flex gap-2 mt-2">
                  <CoordinatorActionButton action="generate-matches" seasonId={seasonId} variant="purple" successMessage="Matches generated successfully">
                    Generate Matches
                  </CoordinatorActionButton>
                  <CoordinatorActionButton action="complete" seasonId={seasonId} variant="red">
                    Complete Season
                  </CoordinatorActionButton>
                </div>
              )}
            </div>
          </div>
          
          <div className={`flex flex-wrap gap-6 text-sm ${season.status === 'active' ? 'text-blue-100' : 'text-slate-500'}`}>
            <div>
              <span className="font-medium">Registration:</span>{' '}
              {new Date(season.registration_start).toLocaleDateString()} - {new Date(season.registration_end).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Season:</span>{' '}
              {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
            </div>
          </div>

          {/* Progress Bar for Active Season */}
          {season.status === 'active' && totalDays > 0 && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-100">Season Progress</span>
                <span className="text-blue-100">{progressPercent}% complete · {daysRemaining} days remaining</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar for Active Season */}
        {season.status === 'active' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">{totalPlayers}</div>
              <div className="text-sm text-slate-500">Players Registered</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-bold text-slate-900">{totalMatches}</div>
              <div className="text-sm text-slate-500">Total Matches</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600">{completedMatches}</div>
              <div className="text-sm text-slate-500">Completed</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-2xl font-bold text-amber-600">{pendingMatches}</div>
              <div className="text-sm text-slate-500">Pending</div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-900 mb-6">Divisions</h2>

        {divisionsWithLevels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No divisions in this season yet.</p>
            <Link href="/divisions" className="text-indigo-600 hover:underline mt-2 inline-block">
              Manage Divisions
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {divisionsWithLevels.map((division: any) => {
              const divCompleted = division.skill_levels?.reduce((sum: number, lvl: any) => sum + (lvl.matches?.filter((m: any) => m.status === 'completed').length || 0), 0)
              const divTotal = division.skill_levels?.reduce((sum: number, lvl: any) => sum + (lvl.matches?.length || 0), 0)
              
              return (
                <div key={division.id} className={`bg-white rounded-2xl border p-6 ${divTotal > 0 ? 'border-blue-200 shadow-md' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 text-lg">{division.name}</h3>
                      {division.type && (
                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                          {division.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {divTotal > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${divCompleted === divTotal ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${(divCompleted / divTotal) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{divCompleted}/{divTotal}</span>
                      </div>
                    )}
                  </div>
                  
                  {division.skill_levels?.length === 0 ? (
                    <p className="text-sm text-slate-400">No skill levels defined</p>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {division.skill_levels.map((level: any) => {
                        const completedCount = level.matches?.filter((m: any) => m.status === 'completed').length || 0
                        const totalCount = level.matches?.length || 0

                        return (
                          <Link
                            key={level.id}
                            href={`/seasons/${seasonId}/skill-level/${level.id}`}
                            className={`block p-4 rounded-xl hover:bg-indigo-50 transition-all ${totalCount > 0 ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-slate-900">{level.name}</div>
                              {totalCount > 0 && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  completedCount === totalCount 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : completedCount > 0 
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {completedCount}/{totalCount}
                                </span>
                              )}
                            </div>
                            {level.min_rating !== null && level.max_rating !== null && (
                              <div className="text-sm text-slate-500 mb-2">
                                Rating: {(level.min_rating / 10).toFixed(1)} - {(level.max_rating / 10).toFixed(1)}
                              </div>
                            )}
                            {totalCount > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="text-xs text-slate-500 mb-1">Recent Matches:</div>
                                {level.matches.slice(0, 2).map((match: any) => (
                                  <div key={match.id} className="flex items-center justify-between text-xs py-1">
                                    <span className={`truncate ${match.status === 'completed' ? 'text-slate-400' : 'text-slate-600'}`}>
                                      {match.home_player_name} vs {match.away_player_name}
                                    </span>
                                    <span className={`ml-2 px-1.5 py-0.5 rounded ${match.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                      {match.status === 'completed' ? match.score || ' Done' : 'Pending'}
                                    </span>
                                  </div>
                                ))}
                                {level.matches.length > 2 && (
                                  <div className="text-xs text-indigo-600 mt-1">+{level.matches.length - 2} more</div>
                                )}
                              </div>
                            )}
                            {totalCount === 0 && (
                              <div className="text-xs text-slate-400 mt-1">
                                No matches yet
                              </div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}