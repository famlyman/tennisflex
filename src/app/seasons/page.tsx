import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export default async function SeasonsPage() {
  const cookieStore = await cookies()
  
  // Regular client for auth check
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
  
  // Admin client for data fetching
  const adminClient = createAdminClient()

  // Log what's being used
  console.log('=== SEASONS PAGE ===')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Has publishable key:', !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  console.log('Has secret key:', !!process.env.SUPABASE_SECRET_KEY)

  // Then fetch all seasons - no order to simplify
  const { data: seasonsData, error } = await adminClient
    .from('seasons')
    .select('*')

  console.log('Seasons query result:', seasonsData, 'Error:', error)

  const seasons = seasonsData || []

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

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">My Seasons</h1>
          <p className="text-slate-600 mt-1">All seasons.</p>
        </div>

        {seasons.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-slate-500">No seasons yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {seasons.map((season: any) => (
              <div key={season.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{season.name}</h3>
                    <p className="text-slate-500">Org ID: {season.organization_id.slice(0,8)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    season.status === 'registration_open' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : season.status === 'active'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {season.status === 'registration_open' ? 'Registration Open' : 
                     season.status === 'active' ? 'Active' : 'Coming Soon'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                  <div>Registration: {new Date(season.registration_start).toLocaleDateString()} - {new Date(season.registration_end).toLocaleDateString()}</div>
                  <div>Season: {new Date(season.season_start).toLocaleDateString()} - {new Date(season.season_end).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}