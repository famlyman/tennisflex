'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Season {
  id: string
  name: string
  organization: { name: string }
}

interface Division {
  id: string
  name: string
  type: string
  display_name: string
}

interface SkillLevel {
  id: string
  name: string
}

interface LeaderboardEntry {
  rank: number
  player_name: string
  wins: number
  losses: number
  matches: number
}

export default function LeaderboardPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')
  const [leaderboardData, setLeaderboardData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeasonId) {
      loadSeasonLeaderboards(selectedSeasonId)
    } else {
      setDivisions([])
      setLeaderboardData({})
    }
  }, [selectedSeasonId])

  async function loadSeasons() {
    try {
      const res = await fetch('/api/leaderboard/seasons')
      const data = await res.json()
      setSeasons(data.seasons || [])
      // Auto-select most recent season if available
      if (data.seasons && data.seasons.length > 0) {
        setSelectedSeasonId(data.seasons[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadSeasonLeaderboards(seasonId: string) {
    setLoading(true)
    try {
      // 1. Get divisions
      const divRes = await fetch(`/api/leaderboard/divisions?season_id=${seasonId}`)
      const divData = await divRes.json()
      const seasonDivs = divData.divisions || []
      setDivisions(seasonDivs)

      const results: Record<string, any> = {}

      // 2. For each division, get skill levels and then their top 5
      for (const div of seasonDivs) {
        const slRes = await fetch(`/api/leaderboard/skill-levels?division_id=${div.id}`)
        const slData = await slRes.json()
        const skillLevels = slData.skill_levels || []

        for (const sl of skillLevels) {
          const lbRes = await fetch(`/api/leaderboard/${sl.id}`)
          if (lbRes.ok) {
            const lbData = await lbRes.json()
            results[sl.id] = {
              skillLevel: sl,
              divisionId: div.id,
              leaderboard: lbData.leaderboard?.slice(0, 5) || []
            }
          }
        }
      }
      setLeaderboardData(results)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Tennis-Flex</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center gap-1">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Season Standings</h1>
            <p className="text-slate-500 mt-2 text-lg">Top 5 players across every division</p>
          </div>

          <div className="w-full md:w-72">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Season</label>
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            >
              <option value="">Select season...</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.organization?.name})</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Fetching latest rankings...</p>
          </div>
        ) : !selectedSeasonId ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-lg">Select a season above to see the standings grid.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {divisions.map((div) => {
              const divSkillLevels = Object.values(leaderboardData).filter(d => d.divisionId === div.id)
              if (divSkillLevels.length === 0) return null

              return (
                <div key={div.id}>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{div.display_name}</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {divSkillLevels.map((data: any) => (
                      <div key={data.skillLevel.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="font-bold text-slate-900">{data.skillLevel.name}</h3>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top 5</span>
                        </div>
                        
                        <div className="p-5">
                          {data.leaderboard.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-4 text-center">No matches played yet</p>
                          ) : (
                            <div className="space-y-3">
                              {data.leaderboard.map((player: any, idx: number) => (
                                <div key={player.player_id} className="flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                                      idx === 1 ? 'bg-slate-100 text-slate-600' :
                                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                                      'text-slate-400'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                      {player.player_name}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-black text-slate-900">{player.wins}W</span>
                                    <span className="text-xs text-slate-400 ml-1">-{player.losses}L</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                          <Link 
                            href={`/leaderboard/${data.skillLevel.id}`}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center justify-center gap-1"
                          >
                            Full Rankings <span className="text-lg leading-none">→</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}