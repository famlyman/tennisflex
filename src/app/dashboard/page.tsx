import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Season, Player } from '@/types/database'

async function getDashboardData(userId: string) {
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

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Check if user is a coordinator
  const { data: coordinatorOrgs } = await supabase
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', userId)

  const isCoordinator = coordinatorOrgs && coordinatorOrgs.length > 0
  const orgIds = coordinatorOrgs?.map(c => c.organization_id) || []

  let seasons: Season[] = []
  let players: Player[] = []
  let organizations: { id: string; name: string; slug: string }[] = []

  if (isCoordinator && orgIds.length > 0) {
    // Get organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds)
    organizations = orgs || []

    // Get seasons for these organizations
    const { data: seasonsData } = await supabase
      .from('seasons')
      .select('*')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(10)
    seasons = seasonsData || []

    // Get player count
    const { data: playersData } = await supabase
      .from('players')
      .select('id')
      .in('organization_id', orgIds)
    const playerCount = playersData?.length || 0
  } else {
    // For regular players, get their player record
    const { data: playerData } = await supabase
      .from('players')
      .select('*')
      .eq('profile_id', userId)
      .single()
    
    if (playerData) {
      // Get active matches for this player
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`home_player_id.eq.${playerData.id},away_player_id.eq.${playerData.id}`)
        .eq('status', 'in_progress')
      
      return {
        profile,
        isCoordinator: false,
        player: playerData,
        activeMatchCount: matches?.length || 0,
        organizations: [],
        seasons: [],
        playerCount: 0,
      }
    }
  }

  const activeSeasonCount = seasons.filter(s => s.status === 'active' || s.status === 'registration_open').length

  return {
    profile,
    isCoordinator,
    player: null,
    activeMatchCount: 0,
    organizations,
    seasons,
    playerCount: players.length,
    activeSeasonCount,
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
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isCoordinator ? (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Active Seasons</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.activeSeasonCount}</p>
                <p className="text-sm text-slate-500">seasons running</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Total Players</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.playerCount}</p>
                <p className="text-sm text-slate-500">registered players</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Organizations</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.organizations.length}</p>
                <p className="text-sm text-slate-500">you coordinate</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">TFR Singles</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {dashboardData.player?.tfr_singles?.toFixed(1) || '--'}
                </p>
                <p className="text-sm text-slate-500">
                  {dashboardData.player ? `${dashboardData.player.match_count_singles} matches` : 'not rated yet'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">TFR Doubles</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {dashboardData.player?.tfr_doubles?.toFixed(1) || '--'}
                </p>
                <p className="text-sm text-slate-500">
                  {dashboardData.player ? `${dashboardData.player.match_count_doubles} matches` : 'not rated yet'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Active Matches</h3>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{dashboardData.activeMatchCount}</p>
                <p className="text-sm text-slate-500">in progress</p>
              </div>
            </>
          )}
        </div>

        {/* Recent Seasons for Coordinators */}
        {isCoordinator && dashboardData.seasons.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Recent Seasons</h2>
            <div className="space-y-3">
              {dashboardData.seasons.slice(0, 5).map((season) => (
                <div key={season.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{season.name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    season.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    season.status === 'registration_open' ? 'bg-emerald-100 text-emerald-700' :
                    season.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {season.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
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
                  <p className="text-sm text-slate-500">Start a new tennis season</p>
                </Link>
                <Link href="/divisions" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Manage Divisions</p>
                  <p className="text-sm text-slate-500">Set up skill levels</p>
                </Link>
                <Link href="/flags" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-900">Review Flags</p>
                  <p className="text-sm text-slate-500">Handle sandbagging reports</p>
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

        {dashboardData.seasons.length === 0 && !isCoordinator && !isPlatformOwner && (
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">Get Started</h3>
            <p className="text-sm text-indigo-700">
              Join a Flex and register for a season to start playing!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}