import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

async function getSeasonWithDivisions(seasonId: string) {
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

  // Get season with organization
  const { data: season, error } = await supabase
    .from('seasons')
    .select(`
      *,
      organization:organizations!seasons_organization_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('id', seasonId)
    .single()

  if (error || !season) {
    return null
  }

  // Get divisions with skill levels
  const { data: divisions } = await supabase
    .from('divisions')
    .select(`
      *,
      skill_levels (
        id,
        name,
        min_rating,
        max_rating
      )
    `)
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

  const seasonData = await getSeasonWithDivisions(seasonId)

  if (!seasonData) {
    notFound()
  }

  if (seasonData.status !== 'registration_open') {
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
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Registration Closed</h1>
          <p className="text-slate-600">Registration for this season is not open.</p>
          <Link href="/seasons" className="mt-4 inline-block text-indigo-600 hover:underline">
            Browse Other Seasons
          </Link>
        </main>
      </div>
    )
  }

  // Check if user is already a player for this organization (can still register for season)
  const profile = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  let existingPlayerRating = null
  if (profile.data) {
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('initial_ntrp_singles, initial_ntrp_doubles')
      .eq('profile_id', profile.data.id)
      .eq('organization_id', seasonData.organization_id)
      .single()
    
    if (existingPlayer) {
      existingPlayerRating = existingPlayer
    }
  }

  // Pre-select ratings if player already has them
  const defaultSingles = existingPlayerRating?.initial_ntrp_singles || ''
  const defaultDoubles = existingPlayerRating?.initial_ntrp_doubles || ''

  // Filter divisions based on player's rating (if they have one)
  const eligibleDivisions = seasonData.divisions?.filter((division: any) => {
    if (!existingPlayerRating) return true // Show all if new player
    const rating = existingPlayerRating.initial_ntrp_singles * 10 // Convert to TFR scale
    return division.skill_levels?.some((sl: any) => {
      const minOk = sl.min_rating === null || rating >= sl.min_rating
      const maxOk = sl.max_rating === null || rating <= sl.max_rating
      return minOk && maxOk
    })
  }) || []

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

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/seasons" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
          ← Back to Seasons
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-2">
              Registration Open
            </span>
            <h1 className="text-3xl font-bold text-slate-900">{seasonData.name}</h1>
            <p className="text-slate-600">{seasonData.organization?.name}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <div>Registration: {new Date(seasonData.registration_start).toLocaleDateString()} - {new Date(seasonData.registration_end).toLocaleDateString()}</div>
            <div>Season: {new Date(seasonData.season_start).toLocaleDateString()} - {new Date(seasonData.season_end).toLocaleDateString()}</div>
          </div>
        </div>

        <form action={`/api/seasons/${seasonId}/register`} method="POST" className="space-y-6">
          <input type="hidden" name="organization_id" value={seasonData.organization_id} />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select Division
            </label>
            <div className="space-y-3">
              {eligibleDivisions.length === 0 ? (
                <p className="text-slate-500 p-4">No divisions match your rating. Contact coordinator for placement.</p>
              ) : (
                seasonData.divisions?.map((division: any) => {
                  const isEligible = eligibleDivisions.some((d: any) => d.id === division.id)
                  return (
                    <label key={division.id} className={`block ${!isEligible ? 'opacity-50' : ''}`}>
                      <input
                        type="radio"
                        name="division_id"
                        value={division.id}
                        required
                        disabled={!isEligible}
                        className="peer sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 hover:border-indigo-300 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 transition-all cursor-pointer ${!isEligible ? 'cursor-not-allowed bg-slate-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{division.name}</p>
                            <p className="text-sm text-slate-500">
                              {division.type === 'mens_singles' && "Men's Singles"}
                              {division.type === 'womens_singles' && "Women's Singles"}
                              {division.type === 'mens_doubles' && "Men's Doubles"}
                              {division.type === 'womens_doubles' && "Women's Doubles"}
                              {division.type === 'mixed_doubles' && "Mixed Doubles"}
                            </p>
                          </div>
                          <div>
                            {division.skill_levels?.length > 0 ? (
                              <div className="text-sm text-slate-500">
                                {division.skill_levels.map((sl: any) => sl.name).join(', ')}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No skill levels</span>
                            )}
                            {!isEligible && (
                              <span className="text-xs text-amber-600 ml-2">(rating mismatch)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <label htmlFor="ntrp_singles" className="block text-sm font-medium text-slate-700 mb-2">
              Your Self-Reported NTRP Rating (Singles)
            </label>
            <select
              id="ntrp_singles"
              name="ntrp_singles"
              required
              defaultValue={defaultSingles}
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select your rating</option>
              <option value="2.5">2.5</option>
              <option value="3.0">3.0</option>
              <option value="3.5">3.5</option>
              <option value="4.0">4.0</option>
              <option value="4.5">4.5</option>
              <option value="5.0">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5">6.5</option>
              <option value="7.0">7.0</option>
            </select>
            <p className="text-sm text-slate-500 mt-1">
              Rate yourself honestly based on your playing ability. Coordinators may verify.
            </p>
          </div>

          <div>
            <label htmlFor="ntrp_doubles" className="block text-sm font-medium text-slate-700 mb-2">
              Your Self-Reported NTRP Rating (Doubles)
            </label>
            <select
              id="ntrp_doubles"
              name="ntrp_doubles"
              required
              defaultValue={defaultDoubles}
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select your rating</option>
              <option value="2.5">2.5</option>
              <option value="3.0">3.0</option>
              <option value="3.5">3.5</option>
              <option value="4.0">4.0</option>
              <option value="4.5">4.5</option>
              <option value="5.0">5.0</option>
              <option value="5.5">5.5</option>
              <option value="6.0">6.0</option>
              <option value="6.5">6.5</option>
              <option value="7.0">7.0</option>
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> By registering, you commit to playing matches throughout the season. 
              Unplayed matches won't count toward your rating or standings.
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Register for Season
          </button>
        </form>
      </main>
    </div>
  )
}