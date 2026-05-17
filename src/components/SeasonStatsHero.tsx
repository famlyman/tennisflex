'use client'

import Link from 'next/link'

interface SeasonStatsHeroProps {
  seasonName: string
  wins: number
  losses: number
  matchesPlayed: number
  playerRank: number | null
  tfrRating?: number
  seasonId: string
}

export default function SeasonStatsHero({
  seasonName,
  wins,
  losses,
  matchesPlayed,
  playerRank,
  tfrRating,
  seasonId
}: SeasonStatsHeroProps) {
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0

  const isPerfect = matchesPlayed > 0 && losses === 0
  const isWinless = matchesPlayed > 0 && wins === 0

  return (
    <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl shadow-xl border border-slate-700/50">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative p-8 md:p-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Season Complete
          </span>
          {playerRank && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-black uppercase tracking-widest">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              #{playerRank} in standings
            </span>
          )}
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-8">
          {seasonName}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Record</p>
            <p className={`text-2xl font-black ${isPerfect ? 'text-amber-400' : isWinless ? 'text-slate-500' : 'text-white'}`}>
              {wins}-{losses}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Win Rate</p>
            <p className="text-2xl font-black text-white">{winRate}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Matches</p>
            <p className="text-2xl font-black text-white">{matchesPlayed}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">TFR Rating</p>
            <p className="text-2xl font-black text-emerald-400">{tfrRating?.toFixed(1) ?? '—'}</p>
          </div>
        </div>

        <Link
          href={`/seasons/${seasonId}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all border border-white/10"
        >
          View Season Summary
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
