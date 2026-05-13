import { createAdminClient } from '@/utils/supabase'

interface FlagTargetPlayer {
  id: string
  tfr_singles: number
  flag_count: number
  organization: { name: string } | null
  profile: { full_name: string } | null
}

interface FlagReporter {
  full_name: string
}

interface RatingFlagRow {
  id: string
  reason: string
  status: string
  created_at: string
  reporter: FlagReporter | null
  target_player: FlagTargetPlayer | null
}

export default async function AdminFlagsPage() {
  const adminClient = createAdminClient()

  // Fetch all pending and reviewed flags
  const { data: rawFlags, error } = await adminClient
    .from('rating_flags')
    .select(`
      id,
      reason,
      status,
      created_at,
      reporter:profiles!rating_flags_reporter_id_fkey(full_name),
      target_player:players!rating_flags_target_player_id_fkey(
        id,
        tfr_singles,
        flag_count,
        organization:organizations!players_organization_id_fkey(name),
        profile:profiles!players_profile_id_fkey(full_name)
      )
    `)
    .order('created_at', { ascending: false })

  const flags = rawFlags as unknown as RatingFlagRow[]

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 text-sm font-bold text-red-600 uppercase tracking-widest mb-2">
            <span>⚖️</span> Integrity Check
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Flag Queue</h1>
          <p className="text-slate-500 font-medium">Review sandbagging reports and maintain rating accuracy across all Flexes.</p>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 mb-8">
            Error loading flags: {error.message}
          </div>
        )}

        {!flags || flags.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🛡️
            </div>
            <p className="font-bold text-slate-900">No active flags</p>
            <p className="text-sm text-slate-500 mt-1">Platform integrity is looking good. All ratings are within expected ranges.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div key={flag.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:border-red-200 transition-colors group">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {flag.status}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">
                        {flag.target_player?.organization?.name}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-black text-slate-400">
                        {flag.target_player?.profile?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg leading-tight">
                          {flag.target_player?.profile?.full_name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          Reported by <span className="text-slate-700">{flag.reporter?.full_name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reason for Flag</p>
                      <p className="text-sm text-slate-700 leading-relaxed italic">&quot;{flag.reason}&quot;</p>
                    </div>
                  </div>

                  <div className="lg:w-64 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current TFR</span>
                        <span className="text-lg font-black text-indigo-600">{flag.target_player ? Math.round(flag.target_player.tfr_singles) : '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Flags</span>
                        <span className="text-lg font-black text-red-600">{flag.target_player?.flag_count}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                        Review Match Logs
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                          Dismiss
                        </button>
                        <button className="py-2 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
                          Uphold
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
