'use client'

import { useState, useEffect } from 'react'

interface EngagementSeason {
  id: string
  name: string
  status: string
  totalMatches: number
  completedMatches: number
  pendingMatches: number
  completionRate: number
}

interface EngagementData {
  seasons: EngagementSeason[]
  overallRate: number
  totalAllMatches: number
  totalAllCompleted: number
}

interface FlaggedPlayer {
  playerId: string
  playerName: string
  flagCount: number
  tfrSingles: number
  tfrDoubles: number
}

interface GrowthSeason {
  seasonId: string
  seasonName: string
  registrationCount: number
  startDate: string
  status: string
}

interface AnalyticsData {
  engagement: EngagementData
  flags: FlaggedPlayer[]
  growth: GrowthSeason[]
}

export default function CoordinatorAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics/coordinator')
        if (!res.ok) throw new Error('Failed to load analytics')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
        <p className="text-sm text-red-600">Analytics unavailable: {error}</p>
      </div>
    )
  }

  const maxRegistrations = Math.max(...data.growth.map(s => s.registrationCount), 1)

  return (
    <div className="space-y-6 mb-8">
      <SectionHeader title="Coordinator Analytics" />

      {/* Engagement Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-emerald-500">📊</span> Match Engagement
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Matches" value={data.engagement.totalAllMatches} color="text-indigo-600" />
          <StatCard label="Completed" value={data.engagement.totalAllCompleted} color="text-emerald-600" />
          <StatCard label="Pending" value={data.engagement.totalAllMatches - data.engagement.totalAllCompleted} color="text-amber-600" />
          <StatCard label="Completion Rate" value={`${data.engagement.overallRate}%`} color="text-blue-600" />
        </div>

        {data.engagement.seasons.map(season => (
          <div key={season.id} className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{season.name}</span>
                <StatusBadge status={season.status} />
              </div>
              <span className="text-xs font-bold text-slate-500">
                {season.completedMatches}/{season.totalMatches} matches
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${season.completionRate}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{season.completionRate}% complete</p>
          </div>
        ))}
      </div>

      {/* Flagging Heatmap */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-red-500">🚩</span> Flagging Heatmap
        </h3>

        {data.flags.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center">
            <p className="text-sm font-medium text-slate-500">No flagged players. All ratings are within expected ranges.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Player</th>
                  <th className="text-right py-2 px-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">Flags</th>
                  <th className="text-right py-2 px-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">TFR-S</th>
                  <th className="text-right py-2 pl-4 font-bold text-slate-400 uppercase tracking-wider text-[11px]">TFR-D</th>
                </tr>
              </thead>
              <tbody>
                {data.flags.map(player => (
                  <tr key={player.playerId} className="border-b border-slate-50 hover:bg-red-50/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="font-medium text-slate-900">{player.playerName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                        player.flagCount >= 3 ? 'bg-red-100 text-red-700' :
                        player.flagCount >= 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {player.flagCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700">{player.tfrSingles}</td>
                    <td className="py-2.5 pl-4 text-right font-mono font-medium text-slate-700">{player.tfrDoubles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Growth Tracking */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-indigo-500">📈</span> Season Growth
        </h3>

        {data.growth.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl text-center">
            <p className="text-sm font-medium text-slate-500">No season data yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.growth.map(season => (
              <div key={season.seasonId} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">{season.seasonName}</span>
                      <StatusBadge status={season.status} />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 ml-2">{season.registrationCount}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(season.registrationCount / maxRegistrations) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    registration_open: 'bg-emerald-100 text-emerald-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-600',
    upcoming: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
