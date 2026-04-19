import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  // Get season with organization and divisions
  const { data: season } = await adminClient
    .from('seasons')
    .select(`
      *,
      organization:organizations!seasons_organization_id_fkey (id, name, slug),
      divisions (*)
    `)
    .eq('id', id)
    .single()

  if (!season) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Season not found</h1>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

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
      </main>
    </div>
  )
}