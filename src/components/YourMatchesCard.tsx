'use client'

import Link from 'next/link'

interface Match {
  id: string
  scheduled_at: string | null
  status: string
  verified_by_opponent?: boolean
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
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-slate-900 text-sm">
                    vs {match.opponent_name}
                  </p>
                  {match.status === 'completed' && match.verified_by_opponent && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-200">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.172a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
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
