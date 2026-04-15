import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CreateSeasonPage() {
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
            // Called outside of request context
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Get organizations where user is a coordinator
  const { data: coordinatorOrgs } = await supabase
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', session.user.id)

  if (!coordinatorOrgs || coordinatorOrgs.length === 0) {
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
          <div className="bg-white rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">No Organizations Found</h1>
            <p className="text-slate-600 mb-6">
              You need to be a coordinator of an organization to create seasons.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const orgIds = coordinatorOrgs.map(c => c.organization_id)
  
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)

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
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create New Season</h1>
          <p className="text-slate-600 mt-1">Set up a new tennis season for your organization.</p>
        </div>

        <form action="/api/seasons" method="POST" className="space-y-6">
          <input type="hidden" name="action" value="create" />
          
          <div>
            <label htmlFor="organization_id" className="block text-sm font-medium text-slate-700 mb-2">
              Organization
            </label>
            <select
              id="organization_id"
              name="organization_id"
              required
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select an organization</option>
              {organizations?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Season Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Spring 2026"
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="registration_start" className="block text-sm font-medium text-slate-700 mb-2">
                Registration Start
              </label>
              <input
                type="date"
                id="registration_start"
                name="registration_start"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="registration_end" className="block text-sm font-medium text-slate-700 mb-2">
                Registration End
              </label>
              <input
                type="date"
                id="registration_end"
                name="registration_end"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="season_start" className="block text-sm font-medium text-slate-700 mb-2">
                Season Start
              </label>
              <input
                type="date"
                id="season_start"
                name="season_start"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="season_end" className="block text-sm font-medium text-slate-700 mb-2">
                Season End
              </label>
              <input
                type="date"
                id="season_end"
                name="season_end"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Season
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}