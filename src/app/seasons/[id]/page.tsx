import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
<<<<<<< HEAD

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
=======
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
<<<<<<< HEAD
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            )
          } catch {
            // Ignore
          }
        },
=======
        setAll() {},
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
<<<<<<< HEAD
=======

>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
  if (!session) {
    redirect('/login')
  }

<<<<<<< HEAD
  const { data: season } = await supabase
=======
  const adminClient = createAdminClient()

  // Get season with organization and divisions
  const { data: season } = await adminClient
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
    .from('seasons')
    .select(`
      *,
      organization:organizations!seasons_organization_id_fkey (id, name, slug),
<<<<<<< HEAD
      divisions (
        *,
        skill_levels (*)
      )
    `)
    .eq('id', seasonId)
=======
      divisions (*)
    `)
    .eq('id', id)
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
    .single()

  if (!season) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
<<<<<<< HEAD
        <div className="text-slate-500">Season not found</div>
=======
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Season not found</h1>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
      </div>
    )
  }

<<<<<<< HEAD
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

=======
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
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
<<<<<<< HEAD
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{season.name}</h1>
              <p className="text-slate-500 mt-1">{season.organization?.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[season.status] || statusColors.upcoming}`}>
              {statusLabels[season.status] || season.status}
            </span>
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

        {season.divisions?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No divisions in this season yet.</p>
            <Link href="/divisions" className="text-indigo-600 hover:underline mt-2 inline-block">
              Manage Divisions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {season.divisions?.map((division: any) => (
              <div key={division.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 text-lg mb-4">{division.name}</h3>
                
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
=======
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{season.name}</h1>
          <p className="text-slate-600">{season.organization?.name}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Season Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500">Status</dt>
              <dd className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                season.status === 'active' ? 'bg-blue-100 text-blue-700' :
                season.status === 'registration_open' ? 'bg-emerald-100 text-emerald-700' :
                season.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {season.status.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Registration</dt>
              <dd className="text-slate-900">
                {new Date(season.registration_start).toLocaleDateString()} - {new Date(season.registration_end).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Season Dates</dt>
              <dd className="text-slate-900">
                {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Divisions</dt>
              <dd className="text-slate-900">{season.divisions?.length || 0}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold mb-4">Divisions</h2>
          {season.divisions?.length === 0 ? (
            <p className="text-slate-500">No divisions yet.</p>
          ) : (
            <div className="space-y-3">
              {season.divisions?.map((division: any) => (
                <div key={division.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{division.name}</h3>
                      <p className="text-sm text-slate-500">{division.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
>>>>>>> 53d2abb86974b20068117ec83a2a583a91656c25
      </main>
    </div>
  )
}