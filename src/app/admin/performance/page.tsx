import { createAdminClient } from '@/utils/supabase'
import Link from 'next/link'

export default async function AdminPerformancePage() {
  const adminClient = createAdminClient()

  // Fetch all complaints
  const { data: complaints, error: compError } = await adminClient
    .from('complaints')
    .select(`
      *,
      player:players(profile:profiles(full_name)),
      organization:organizations(name)
    `)
    .order('created_at', { ascending: false })

  // Fetch match health stats per organization
  const { data: orgs } = await adminClient.from('organizations').select('id, name')
  
  const healthStats = await Promise.all((orgs || []).map(async (org) => {
    // Get all skill levels for this org's seasons
    const { data: seasons } = await adminClient.from('seasons').select('id').eq('organization_id', org.id)
    const seasonIds = seasons?.map(s => s.id) || []
    
    if (seasonIds.length === 0) return { name: org.name, total: 0, completed: 0, percent: 0 }

    const { data: divisions } = await adminClient.from('divisions').select('id').in('season_id', seasonIds)
    const divIds = divisions?.map(d => d.id) || []
    
    if (divIds.length === 0) return { name: org.name, total: 0, completed: 0, percent: 0 }

    const { data: skillLevels } = await adminClient.from('skill_levels').select('id').in('division_id', divIds)
    const slIds = skillLevels?.map(sl => sl.id) || []

    if (slIds.length === 0) return { name: org.name, total: 0, completed: 0, percent: 0 }

    const { count: total } = await adminClient.from('matches').select('*', { count: 'exact', head: true }).in('skill_level_id', slIds)
    const { count: completed } = await adminClient.from('matches').select('*', { count: 'exact', head: true }).in('skill_level_id', slIds).eq('status', 'completed')
    
    const percent = total && total > 0 ? Math.round((completed || 0) / total * 100) : 0
    return { name: org.name, total: total || 0, completed: completed || 0, percent }
  }))

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">
            <span>📊</span> Performance & Quality
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">League Health & Complaints</h1>
          <p className="text-slate-500 font-medium">Oversee coordinator responsiveness and platform-wide match activity.</p>
        </header>

        {/* Health Grid */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Chapter Completion Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthStats.map((stat) => (
              <div key={stat.name} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold text-slate-900">{stat.name}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-black ${
                    stat.percent > 70 ? 'bg-emerald-50 text-emerald-600' : 
                    stat.percent > 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {stat.percent}% Healthy
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      stat.percent > 70 ? 'bg-emerald-500' : 
                      stat.percent > 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>{stat.completed} Completed</span>
                  <span>{stat.total} Total Matches</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Complaints Queue */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span>📫</span> Player Feedback Loop
          </h2>
          
          {!complaints || complaints.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
              <p className="font-bold text-slate-900">No active complaints</p>
              <p className="text-sm text-slate-500 mt-1">Your coordinators are performing well! No player issues reported.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((comp: any) => (
                <div key={comp.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          comp.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {comp.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(comp.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">
                          {comp.organization?.name}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 text-lg mb-2">{comp.subject}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">{comp.description}</p>
                      <div className="text-xs text-slate-400 font-medium">
                        Reported by <span className="text-slate-900 font-bold">{comp.player?.profile?.full_name}</span>
                      </div>
                    </div>
                    <div className="lg:w-48 flex flex-col gap-2">
                      <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                        Message Player
                      </button>
                      <button className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
