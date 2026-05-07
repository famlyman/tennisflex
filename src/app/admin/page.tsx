import { createAdminClient } from '@/utils/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  const adminClient = createAdminClient()

  // Fetch High-Level Stats
  const { count: orgCount } = await adminClient
    .from('organizations')
    .select('*', { count: 'exact', head: true })

  const { count: playerCount } = await adminClient
    .from('players')
    .select('*', { count: 'exact', head: true })

  const { count: requestCount } = await adminClient
    .from('chapter_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: matchCount } = await adminClient
    .from('matches')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { name: 'Total Flexes', value: orgCount || 0, icon: '🏙️', color: 'bg-blue-500' },
    { name: 'Total Players', value: playerCount || 0, icon: '👥', color: 'bg-emerald-500' },
    { name: 'Pending Requests', value: requestCount || 0, icon: '🚀', color: 'bg-amber-500' },
    { name: 'Matches Played', value: matchCount || 0, icon: '🎾', color: 'bg-indigo-500' },
  ]

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Control Room</h1>
          <p className="text-slate-500 font-medium">Platform-wide overview and management.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-xl`}>
                  {stat.icon}
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.name}</span>
              </div>
              <div className="text-4xl font-black text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>⚡</span> Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Link 
                href="/admin/chapters" 
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-500 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    🚀
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Review Requests</div>
                    <div className="text-xs text-slate-500">Approve new Flex chapters</div>
                  </div>
                </div>
                <span className="text-indigo-600 font-bold">→</span>
              </Link>

              <Link 
                href="/admin/flags" 
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-500 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    ⚖️
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Integrity Check</div>
                    <div className="text-xs text-slate-500">View sandbagging reports</div>
                  </div>
                </div>
                <span className="text-red-600 font-bold">→</span>
              </Link>

              <Link 
                href="/admin/promotions" 
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    💰
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Manage Ads</div>
                    <div className="text-xs text-slate-500">Update global promotions</div>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold">→</span>
              </Link>
            </div>
          </section>

          {/* Recent Alerts Placeholder */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>🔔</span> System Alerts
            </h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-4">
                🎉
              </div>
              <p className="font-bold text-slate-900">All systems operational</p>
              <p className="text-sm text-slate-500 mt-1">No critical complaints or flags pending review.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
