import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'
import NotificationBell from '@/components/NotificationBell'

export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
  const adminClient = createAdminClient()

  // Get user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Check if user is a coordinator
  const { data: coordinatorOrgs } = await adminClient
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', userId)

  const isCoordinator = coordinatorOrgs && coordinatorOrgs.length > 0
  const orgIds = coordinatorOrgs?.map(c => c.organization_id) || []

  if (isCoordinator && orgIds.length > 0) {
    // Get organizations
    const { data: orgs } = await adminClient
      .from('organizations')
      .select('*')
      .in('id', orgIds)
    const organizations = orgs || []

    // Get seasons for these organizations with division counts
    const { data: seasonsData } = await adminClient
      .from('seasons')
      .select(`
        *,
        divisions (id),
        organization:organizations!seasons_organization_id_fkey (name)
      `)
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })

    // Get player count
    const { count: playerCount } = await adminClient
      .from('players')
      .select('*', { count: 'exact', head: true })
      .in('organization_id', orgIds)

    // Get season IDs for these organizations
    const seasonRes = await adminClient.from('seasons').select('id').in('organization_id', orgIds)
    const seasonIds = (seasonRes.data || []).map(s => s.id)

    // Get division IDs for these seasons
    const divisionRes = seasonIds.length > 0 
      ? await adminClient.from('divisions').select('id').in('season_id', seasonIds)
      : { data: [] }
    const divisionIds = (divisionRes.data || []).map(d => d.id)

    // Get skill level IDs for these divisions
    const skillLevelRes = divisionIds.length > 0
      ? await adminClient.from('skill_levels').select('id').in('division_id', divisionIds)
      : { data: [] }
    const skillLevelIds = (skillLevelRes.data || []).map(s => s.id)

    // Get total matches
    let totalMatches = 0
    if (skillLevelIds.length > 0) {
      const matchRes = await adminClient.from('matches').select('*', { count: 'exact', head: true }).in('skill_level_id', skillLevelIds)
      totalMatches = matchRes.count || 0
    }

    // Get pending matches (scheduled or in_progress)
    let pendingMatches = 0
    if (skillLevelIds.length > 0) {
      const pendingRes = await adminClient.from('matches').select('*', { count: 'exact', head: true }).in('skill_level_id', skillLevelIds).neq('status', 'completed')
      pendingMatches = pendingRes.count || 0
    }

    const activeSeasonCount = (seasonsData || []).filter(
      s => s.status === 'active' || s.status === 'registration_open'
    ).length

    return {
      profile,
      isCoordinator,
      player: null,
      activeMatchCount: 0,
      organizations,
      seasons: seasonsData || [],
      playerCount: playerCount || 0,
      activeSeasonCount,
      totalMatches: totalMatches || 0,
      pendingMatches: pendingMatches || 0,
    }
  }

  // Player - get their full record including ratings
  const { data: playerData } = await adminClient
    .from('players')
    .select('*, organization:organizations!players_organization_id_fkey (name)')
    .eq('profile_id', userId)
    .single()

  if (playerData) {
    const playerOrgId = playerData.organization_id

    const { data: playerSeasons } = await adminClient
      .from('seasons')
      .select(`
        *,
        divisions (id),
        organization:organizations!seasons_organization_id_fkey (name)
      `)
      .eq('organization_id', playerOrgId)
      .order('created_at', { ascending: false })

    return {
      profile,
      isCoordinator,
      player: playerData,
      activeMatchCount: 0,
      organizations: [],
      seasons: playerSeasons || [],
      playerCount: 0,
      activeSeasonCount: (playerSeasons || []).filter(
        s => s.status === 'active' || s.status === 'registration_open'
      ).length,
      totalMatches: 0,
      pendingMatches: 0,
    }
  }

  return {
    profile,
    isCoordinator,
    player: null,
    activeMatchCount: 0,
    organizations: [],
    seasons: [],
    playerCount: 0,
    activeSeasonCount: 0,
    totalMatches: 0,
    pendingMatches: 0,
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

  const dashboardData = await getDashboardData(user.id)
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
            <span className="font-bold text-xl tracking-tight">Tennis-Flex</span>
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
              ? 'Manage your seasons and divisions from here.' 
              : 'Browse seasons and track your TFR ratings.'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isCoordinator ? (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Active Seasons</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.activeSeasonCount}</p>
                <p className="text-sm text-slate-500">running</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Total Players</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.playerCount}</p>
                <p className="text-sm text-slate-500">registered</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Matches Played</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.totalMatches}</p>
                <p className="text-sm text-slate-500">completed</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Pending</h3>
                <p className="text-3xl font-bold text-amber-600 mb-1">{dashboardData.pendingMatches}</p>
                <p className="text-sm text-slate-500">awaiting scores</p>
              </div>
            </>
          ) : (
            // Player view - show TFR ratings and recent activity
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Your TFR Rating</h3>
                <p className="text-sm text-slate-500 mb-4">Singles • Doubles</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-3xl font-bold text-indigo-600">
                      {dashboardData.player?.tfr_singles ? (parseFloat(dashboardData.player.tfr_singles) / 10).toFixed(1) : '--'}
                    </p>
                    <p className="text-xs text-slate-500">Singles</p>
                    <p className="text-xs text-slate-400">
                      {dashboardData.player?.initial_ntrp_singles ? `NTRP: ${dashboardData.player.initial_ntrp_singles}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-indigo-600">
                      {dashboardData.player?.tfr_doubles ? (parseFloat(dashboardData.player.tfr_doubles) / 10).toFixed(1) : '--'}
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
                  <Link href="/leaderboard" className="text-sm text-indigo-600 hover:underline">
                    View Full →
                  </Link>
                </div>
                <p className="text-slate-500 text-sm">Join a season to appear on the leaderboard!</p>
              </div>
            </>
          )}
        </div>

        {/* Seasons List for Coordinators */}
        {isCoordinator && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Seasons</h2>
            </div>
            
            {dashboardData.seasons.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No seasons yet. Create your first season to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.seasons.map((season: any) => (
                  <div key={season.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-slate-900">{season.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          season.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          season.status === 'registration_open' ? 'bg-emerald-100 text-emerald-700' :
                          season.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                          season.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {season.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {season.organization?.name || 'Unknown'} • {season.divisions?.length || 0} divisions
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(season.registration_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/seasons/${season.id}`}
                      className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Seasons List for Players (show seasons available for registration) */}
        {!isCoordinator && dashboardData.player && (
          <div className="space-y-6">
            {/* Active/Registered Season */}
            {dashboardData.seasons.find(s => s.status === 'active' || s.status === 'registration_open') && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Your Season</h2>
                </div>
                
                {dashboardData.seasons
                  .filter(s => s.status === 'active' || s.status === 'registration_open')
                  .map((season: any) => (
                    <div key={season.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl border border-indigo-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-slate-900 text-lg">{season.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            season.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {season.status === 'registration_open' ? 'Registration Open' : 'Active'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {season.organization?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/seasons/${season.id}`}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        View Season
                      </Link>
                    </div>
                  ))}
              </div>
            )}

            {/* All Organization Seasons */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">All {dashboardData.player.organization?.name} Seasons</h2>
              </div>
              
              {dashboardData.seasons.length === 0 ? (
                <p className="text-slate-500">No seasons available in your organization.</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.seasons.map((season: any) => (
                    <div key={season.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-slate-900">{season.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            season.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            season.status === 'registration_open' ? 'bg-emerald-100 text-emerald-700' :
                            season.status === 'completed' ? 'bg-slate-200 text-slate-600' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {season.status === 'registration_open' ? 'Registration Open' : season.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
                        </p>
                      </div>
                      {season.status === 'registration_open' ? (
                        <Link
                          href={`/seasons/${season.id}/register`}
                          className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Register
                        </Link>
                      ) : (
                        <Link
                          href={`/seasons/${season.id}`}
                          className="px-3 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {isPlatformOwner ? (
              <>
                <Link href="/admin/chapters" className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Manage Flexes</p>
                  <p className="text-sm text-slate-500">Approve/deny Flex requests</p>
                </Link>
                <Link href="/seasons/create" className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Create Season</p>
                  <p className="text-sm text-slate-500">Start a new tennis season</p>
                </Link>
                <Link href="/dashboard" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">View Profile</p>
                  <p className="text-sm text-slate-500">Your account settings</p>
                </Link>
              </>
            ) : isCoordinator ? (
              <>
                <Link href="/seasons/create" className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Create Season</p>
                  <p className="text-sm text-slate-500">Start a new season</p>
                </Link>
                <Link href="/leaderboard" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Leaderboards</p>
                  <p className="text-sm text-slate-500">View division rankings</p>
                </Link>
                <Link href="/divisions" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Manage Divisions</p>
                  <p className="text-sm text-slate-500">Setup divisions</p>
                </Link>
              </>
            ) : (
              <>
                <Link href="/seasons" className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Browse Seasons</p>
                  <p className="text-sm text-slate-500">Find a league near you</p>
                </Link>
                <Link href="/profile" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Edit Profile</p>
                  <p className="text-sm text-slate-500">Update your NTRP ratings</p>
                </Link>
                <Link href="/leaderboard" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Leaderboards</p>
                  <p className="text-sm text-slate-500">View current standings</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}