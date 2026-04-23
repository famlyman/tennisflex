import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

// Find skill level that matches a specific rating
function findMatchingSkillLevel(skillLevels: any[], rating: number) {
  if (!skillLevels || !rating) return null
  return skillLevels.find((sl: any) => 
    rating >= sl.min_rating && rating <= sl.max_rating
  )
}

// Division type categories
function getDivisionCategory(type: string): 'singles' | 'doubles' {
  if (type.includes('singles')) return 'singles'
  return 'doubles'
}

function getDivisionLabel(type: string): string {
  switch (type) {
    case 'mens_singles': return "Men's Singles"
    case 'womens_singles': return "Women's Singles"
    case 'mens_doubles': return "Men's Doubles"
    case 'womens_doubles': return "Women's Doubles"
    case 'mixed_doubles': return "Mixed Doubles"
    default: return type
  }
}

async function getSeasonWithSkillLevels(seasonId: string) {
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

  const { data: season } = await supabase
    .from('seasons')
    .select('*, organization:organizations!seasons_organization_id_fkey (id, name, slug)')
    .eq('id', seasonId)
    .single()

  if (!season) return null

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

  // Get user profile data (gender + BOTH ratings)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, gender, initial_ntrp_singles, initial_ntrp_doubles')
    .eq('id', session.user.id)
    .single()

  // Check if already a player in this organization
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('initial_ntrp_singles, initial_ntrp_doubles')
    .eq('profile_id', session.user.id)
    .eq('organization_id', seasonData.organization_id)
    .single()

  // Use profile data first, then player data, then defaults
  const userGender = profile?.gender || null
  const singlesRating = profile?.initial_ntrp_singles || existingPlayer?.initial_ntrp_singles || 3.5
  const doublesRating = profile?.initial_ntrp_doubles || existingPlayer?.initial_ntrp_doubles || 3.5

  // Map gender to allowed division types
  const genderMap: Record<string, string[]> = {
    male: ['mens_singles', 'mens_doubles', 'mixed_doubles'],
    female: ['womens_singles', 'womens_doubles', 'mixed_doubles'],
    other: ['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles'],
    null: ['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles'],
  }

  const allowedTypes = genderMap[userGender as string] || genderMap['null']

  // Filter divisions and find matching skill level for each
  const userDivisions = seasonData.divisions
    ?.filter((d: any) => allowedTypes.includes(d.type))
    .map((d: any) => {
      const category = getDivisionCategory(d.type)
      const rating = category === 'singles' ? singlesRating : doublesRating
      const matchingLevel = findMatchingSkillLevel(d.skill_levels, rating)
      return {
        ...d,
        category,
        rating,
        matchingLevel,
        skillLevelName: matchingLevel?.name || null,
      }
    })
    .filter((d: any) => d.matchingLevel !== null) || []

  // Check if already registered
  const { data: existingRegistrations } = await supabase
    .from('season_registrations')
    .select('id, division_id, status')
    .eq('profile_id', session.user.id)
    .eq('season_id', seasonId)
    .in('status', ['pending', 'confirmed'])

  const isRegistered = existingRegistrations && existingRegistrations.length > 0
  const registeredDivisionIds = existingRegistrations?.map(r => r.division_id) || []

  // Show prompt to update profile if no ratings set
  const needsProfileSetup = !profile?.initial_ntrp_singles && !profile?.initial_ntrp_doubles

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
          <p className="text-sm text-slate-500 mt-2">
            Rating: {singlesRating} (Singles) / {doublesRating} (Doubles)
          </p>
        </div>

        {needsProfileSetup && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <Link href="/profile" className="underline font-medium">Set up your ratings in your profile</Link> before registering.
            </p>
          </div>
        )}

        {isRegistered ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-emerald-800 mb-4">You're Registered!</h2>
            <div className="space-y-2">
              {userDivisions
                .filter((d: any) => registeredDivisionIds.includes(d.id))
                .map((d: any) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span className="text-emerald-700">{getDivisionLabel(d.type)}</span>
                    <span className="font-medium text-emerald-800">{d.skillLevelName}</span>
                  </div>
                ))}
            </div>
            <p className="text-sm text-emerald-600 mt-4">Check your dashboard for match schedule.</p>
          </div>
        ) : (
          <form action={`/api/seasons/${seasonId}/register`} method="POST" className="space-y-6">
            <input type="hidden" name="organization_id" value={seasonData.organization_id} />

            {/* Your Divisions (select which to play) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Select the divisions you want to play:
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Check the boxes for each division you'd like to register for.
              </p>
              
              {userDivisions.length > 0 ? (
                <div className="space-y-3">
                  {userDivisions.map((division: any) => (
                    <label key={division.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="division_ids"
                          value={division.id}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{getDivisionLabel(division.type)}</p>
                          <p className="text-sm text-slate-500">
                            Using your {division.category} rating: {division.rating}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {division.skillLevelName}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  No matching divisions found for your ratings. Set up your ratings in your profile first.
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Commitment:</strong> Registering commits you to play all season matches in the divisions you select.
              </p>
            </div>

            {userDivisions.length > 0 && (
              <button type="submit" className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                Register for Selected Divisions
              </button>
            )}
          </form>
        )}
      </main>
    </div>
  )
}