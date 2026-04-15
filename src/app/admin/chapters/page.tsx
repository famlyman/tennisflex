import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getChapterRequests() {
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
          }
        },
      },
    }
  )
  
  const { data } = await supabase
    .from('chapter_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  
  return data || []
}

export default async function AdminChapters() {
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
          }
        },
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if user is platform owner (for now, allow coordinators to access)
  const userType = session.user.user_metadata?.user_type
  
  const requests = await getChapterRequests()
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

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
          <h1 className="text-3xl font-bold text-slate-900">Chapter Requests</h1>
          <p className="text-slate-600 mt-1">
            Review and approve requests to start new Tennis-Flex chapters.
          </p>
        </div>

        {/* Pending Requests */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-sm px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No pending chapter requests.</p>
              <p className="text-sm text-slate-400 mt-1">
                Requests will appear here when someone submits "Request a Chapter".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div 
                  key={request.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">
                          {request.chapter_name}
                        </h3>
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">
                        {request.region}
                      </p>
                      <div className="text-sm text-slate-600 mb-4">
                        <p className="font-medium mb-1">Reason:</p>
                        <p className="text-slate-500">{request.reason}</p>
                      </div>
                      <div className="text-sm text-slate-500">
                        <span>Requested by: {request.full_name}</span>
                        <span className="mx-2">•</span>
                        <span>{request.email}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                      <form action={`/api/admin/chapters/${request.id}/approve`} method="POST">
                        <input type="hidden" name="chapter_name" value={request.chapter_name} />
                        <input type="hidden" name="region" value={request.region} />
                        <button 
                          type="submit"
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={`/api/admin/chapters/${request.id}/deny`} method="POST">
                        <button 
                          type="submit"
                          className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                          Deny
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Processed Requests</h2>
            <div className="space-y-4">
              {processedRequests.map(request => (
                <div 
                  key={request.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{request.chapter_name}</h3>
                      <p className="text-sm text-slate-500">{request.region}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      request.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}