'use client'

import Link from 'next/link'

interface Match {
  id: string
  scheduled_at: string | null
  status: string
  skill_level_name: string
  skill_level_id?: string
  division_type: string
  opponent_name: string
  opponent_id?: string
  season_id?: string
}

interface YourMatchesCardProps {
  matches: Match[]
  playerId?: string
}

export default function YourMatchesCard({ matches, playerId }: YourMatchesCardProps) {
  if (matches.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Matches</h3>
      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="p-4 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">
                  vs {match.opponent_name}
                </p>
                <p className="text-xs text-slate-500">
                  {match.skill_level_name} • {match.division_type?.replace('_', ' ')}
                </p>
                {match.scheduled_at && (
                  <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">
                    Scheduled: {new Date(match.scheduled_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Link
                href={`/matches/${match.id}`}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm group-hover:shadow-md"
              >
                Coordinate
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
