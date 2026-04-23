import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

async function getSeasonWithSkillLevels(seasonId: string) {
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

  const { data: season } = await supabase
    .from('seasons')
    .select('*, organization:organizations!seasons_organization_id_fkey (id, name, slug)')
    .eq('id', seasonId)
    .single()

  if (!season) return null

  // Get divisions with skill levels - include division type
  const { data: divisions } = await supabase
    .from('divisions')
    .select('id, name, type, season_id, skill_levels (id, name, min_rating, max_rating)')
    .eq('season_id', seasonId)
    .order('name')

  return { ...season, divisions: divisions || [] }
}

export default async function SeasonRegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const seasonData = await getSeasonWithSkillLevels(seasonId)
  if (!seasonData) notFound()

  if (seasonData.status !== 'registration_open') {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Registration Closed</h1>
          <p className="text-slate-600">Registration for this season is not open.</p>
        </main>
      </div>
    )
  }

  // Check existing player
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  let existingPlayer: any = null
  if (profile?.id) {
    const { data: p } = await supabase
      .from('players')
      .select('initial_ntrp_singles, initial_ntrp_doubles')
      .eq('profile_id', profile.id)
      .eq('organization_id', seasonData.organization_id)
      .single()
    existingPlayer = p
  }

  const defaultNtrp = existingPlayer?.initial_ntrp_singles || 3.5

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-3">
            Registration Open
          </span>
          <h1 className="text-3xl font-bold text-slate-900">{seasonData.name}</h1>
          <p className="text-slate-600">{seasonData.organization?.name}</p>
        </div>

        <form action={`/api/seasons/${seasonId}/register`} method="POST" className="space-y-8">
          <input type="hidden" name="organization_id" value={seasonData.organization_id} />

          {/* Step 1: NTRP Rating */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Step 1: Tell us your rating</h2>
            <p className="text-sm text-slate-500 mb-4">
              Find your NTRP level at <a href="https://www.usta.com/ntrp" target="_blank" className="text-indigo-600 underline">usta.com/ntrp</a>
            </p>
            
            <label htmlFor="ntrp_singles" className="block text-sm font-medium text-slate-700 mb-2">
              Your NTRP Rating (Singles)
            </label>
            <select
              id="ntrp_singles"
              name="ntrp_singles"
              required
              defaultValue={defaultNtrp}
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500"
            >
              {[2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Choose Division/Skill Level */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Step 2: Choose your division</h2>
            <p className="text-sm text-slate-500 mb-4">
              Select one option based on your rating and play type.
            </p>
            
            <div className="space-y-3">
              {seasonData.divisions?.map((division: any) => (
                <div key={division.id} className="space-y-2">
                  <p className="font-medium text-slate-700 text-sm uppercase tracking-wide">
                    {division.type === 'mens_singles' ? "Men's Singles" :
                     division.type === 'womens_singles' ? "Women's Singles" :
                     division.type === 'mens_doubles' ? "Men's Doubles" :
                     division.type === 'womens_doubles' ? "Women's Doubles" :
                     "Mixed Doubles"}
                  </p>
                  
                  {division.skill_levels?.length === 0 ? (
                    <p className="text-sm text-slate-400 pl-4">No skill levels configured</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pl-4">
                      {division.skill_levels.map((sl: any) => (
                        <label key={sl.id} className="block cursor-pointer">
                          <input
                            type="radio"
                            name="division_id"
                            value={division.id}
                            data-skill-level={sl.id}
                            required
                            className="peer sr-only"
                          />
                          <div className="p-3 rounded-lg border-2 border-slate-200 text-center peer-checked:border-indigo-600 peer-checked:bg-indigo-50 hover:border-indigo-300 transition-all">
                            <p className="font-semibold text-slate-900">{sl.name}</p>
                            {sl.min_rating && sl.max_rating && (
                              <p className="text-xs text-slate-500">
                                {(sl.min_rating/10).toFixed(1)} - {(sl.max_rating/10).toFixed(1)}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Commitment:</strong> By registering, you commit to playing matches throughout the season.
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Complete Registration
          </button>
        </form>
      </main>
    </div>
  )
}