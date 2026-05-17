'use client'

interface MatchResult {
  id: string
  opponentName: string
  playerTeamName?: string
  isWin: boolean
  score: string | null
  date: string | null
}

interface ResultsCardProps {
  results: MatchResult[]
}

export default function ResultsCard({ results }: ResultsCardProps) {
  if (results.length === 0) return null

  let streak = 0
  let streakType: 'win' | 'loss' | null = null
  for (const r of results) {
    if (streakType === null) {
      streakType = r.isWin ? 'win' : 'loss'
      streak = 1
    } else if ((streakType === 'win' && r.isWin) || (streakType === 'loss' && !r.isWin)) {
      streak++
    } else {
      break
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Recent Results</h3>
        {streak >= 2 && (
          <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
            streakType === 'win'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {streak} {streakType === 'win' ? 'W' : 'L'} Streak
          </span>
        )}
      </div>
      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result.id}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
              result.isWin
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {result.isWin ? 'W' : 'L'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">
                {result.playerTeamName
                  ? `${result.playerTeamName} vs ${result.opponentName}`
                  : `vs ${result.opponentName}`
                }
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {result.score && <span className="font-medium">{result.score}</span>}
                {result.date && (
                  <>
                    <span className="text-slate-300">&#x2022;</span>
                    <span>{new Date(result.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
