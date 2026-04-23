import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  // Get user's orgs (same pattern as getSeasonsForUser)
  const { data: coordinatorOrgs } = await supabase
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', session.user.id)

  const orgIds = coordinatorOrgs?.map(c => c.organization_id) || []

  // Query each org separately
  let allSeasons: any[] = []
  for (const orgId of orgIds) {
    const { data: orgSeasons, error: orgErr } = await supabase
      .from('seasons')
      .select('*')
      .eq('organization_id', orgId)
    
    if (orgSeasons) {
      allSeasons = [...allSeasons, ...orgSeasons]
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
  const { data: divisions } = await supabase
    .from('divisions')
    .select('*')
    .eq('season_id', seasonId)

  // Get skill levels for all divisions
  const divisionIds = divisions?.map(d => d.id) || []
  const { data: skillLevels } = await supabase
    .from('skill_levels')
    .select('*')
    .in('division_id', divisionIds)

  // Attach skill levels to divisions
  const divisionsWithLevels = divisions?.map(div => ({
    ...div,
    skill_levels: skillLevels?.filter(sl => sl.division_id === div.id) || []
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/seasons" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
          ← Back to Seasons
        </Link>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{season.name}</h1>
              <p className="text-slate-500 mt-1">{season.organization?.name}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[season.status] || statusColors.upcoming}`}>
                {statusLabels[season.status] || season.status}
              </span>
              {isCoordinator && season.status === 'upcoming' && (
                <div className="flex gap-2">
                  <form action={`/api/seasons/${seasonId}/open-registration`} method="POST">
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Open Registration
                    </button>
                  </form>
                  <form action={`/api/seasons/${seasonId}/start`} method="POST">
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Season Now
                    </button>
                  </form>
                </div>
              )}
              {isCoordinator && season.status === 'registration_open' && (
                <form action={`/api/seasons/${seasonId}/close-registration`} method="POST">
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Close Registration & Start
                  </button>
                </form>
              )}
              {isCoordinator && season.status === 'active' && (
                <div className="flex gap-2">
                  <form action={`/api/seasons/${seasonId}/generate-matches`} method="POST">
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Generate Matches
                    </button>
                  </form>
                  <form action={`/api/seasons/${seasonId}/complete`} method="POST">
                    <button
                      type="submit"
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Complete Season
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div>
              <span className="font-medium">Registration:</span>{' '}
              {new Date(season.registration_start).toLocaleDateString()} - {new Date(season.registration_end).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Season:</span>{' '}
              {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-6">Divisions</h2>

        {divisionsWithLevels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No divisions in this season yet.</p>
            <Link href="/divisions" className="text-indigo-600 hover:underline mt-2 inline-block">
              Manage Divisions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {divisionsWithLevels.map((division: any) => (
              <div key={division.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-slate-900 text-lg">{division.name}</h3>
                  {division.type && (
                    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                      {division.type.replace('_', ' ')}
                    </span>
                  )}
                </div>
                
                {division.skill_levels?.length === 0 ? (
                  <p className="text-sm text-slate-400">No skill levels defined</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {division.skill_levels.map((level: any) => (
                      <Link
                        key={level.id}
                        href={`/seasons/${seasonId}/skill-level/${level.id}`}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{level.name}</div>
                          {level.min_rating !== null && level.max_rating !== null && (
                            <div className="text-sm text-slate-500">
                              Rating: {level.min_rating} - {level.max_rating}
                            </div>
                          )}
                        </div>
                        <div className="text-indigo-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}