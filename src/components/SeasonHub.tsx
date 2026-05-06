'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Division {
  id: string
  name: string
  type: string
}

interface SkillLevel {
  id: string
  name: string
  division_id: string
}

interface LeaderboardEntry {
  player_id: string
  player_name: string
  wins: number
  losses: number
  matches: number
}

interface PulseMatch {
  id: string
  winner_name: string
  loser_name: string
  score: string
}

interface SeasonHubData {
  season: {
    id: string
    name: string
    status: string
    season_start: string
    season_end: string
    registration_start: string
    registration_end: string
    organization?: { name: string }
  }
  divisions: Division[]
  skillLevels: SkillLevel[]
  stats: {
    totalPlayers: number
    totalMatches: number
    completedMatches: number
    pendingMatches: number
  }
  playerSkillLevelId: string | null
  divisionPulse?: PulseMatch[]
}

interface RatingMove {
  playerId: string
  playerName: string
  oldRating: number
  newRating: number
  matches: number
}

interface SeasonHubProps {
  data: SeasonHubData
  playerId: string
  playerTfr: number | null
  playerMatches: number
}

const DIVISION_LABELS: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
}

export default function SeasonHub({ data, playerId, playerTfr, playerMatches }: SeasonHubProps) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>('')
  const [leaderboardsBySkillLevel, setLeaderboardsBySkillLevel] = useState<Record<string, any>>({})
  const [playerRank, setPlayerRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [ratingMove, setRatingMove] = useState<RatingMove | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get skill levels for selected division
  const divisionSkillLevels = selectedDivisionId 
    ? data.skillLevels.filter(sl => sl.division_id === selectedDivisionId)
    : data.skillLevels

  // Create a map of skillLevelId -> division info
  const skillLevelDivisionMap: Record<string, any> = {}
  data.skillLevels.forEach(sl => {
    const div = data.divisions.find(d => d.id === sl.division_id)
    if (div) {
      skillLevelDivisionMap[sl.id] = div
    }
  })

  // Fetch leaderboards for all skill levels in the division
  useEffect(() => {
    if (divisionSkillLevels.length > 0) {
      fetchAllLeaderboards(divisionSkillLevels)
    } else {
      setLeaderboardsBySkillLevel({})
      setPlayerRank(null)
    }
  }, [selectedDivisionId])

  async function fetchAllLeaderboards(skillLevels: SkillLevel[]) {
    setLoading(true)
    try {
      const results: Record<string, any> = {}
      let playerRankFound: number | null = null

      for (const sl of skillLevels) {
        const res = await fetch(`/api/leaderboard/${sl.id}`)
        if (res.ok) {
          const data = await res.json()
          const leaderboard = data.leaderboard || []
          results[sl.id] = {
            skillLevel: sl,
            leaderboard: leaderboard.slice(0, 5),
          }
          // Find player rank
          if (!playerRankFound) {
            const rank = leaderboard.findIndex((e: any) => e.player_id === playerId)
            if (rank !== -1) {
              playerRankFound = rank + 1
            }
          }
        }
      }
      
      setLeaderboardsBySkillLevel(results)
      setPlayerRank(playerRankFound)
    } catch (err) {
      console.error('Failed to fetch leaderboards:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch rating moves for the player
  useEffect(() => {
    async function fetchRatingMoves() {
      if (!playerId || !data.season?.id) return
      try {
        const res = await fetch(`/api/profile/stats?player_id=${playerId}&season_id=${data.season.id}`)
        if (res.ok) {
          const data = await res.json()
          setRatingMove(data.ratingMove || null)
        }
      } catch (err) {
        console.error('Failed to fetch rating moves:', err)
      }
    }
    fetchRatingMoves()
  }, [playerId, data.season?.id])

  // Calculate progress
  const now = new Date().getTime()
  const start = new Date(data.season.season_start).getTime()
  const end = new Date(data.season.season_end).getTime()
  const progress = Math.min(100, Math.round(((now - start) / (end - start)) * 100))

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Season Header */}
        <div className={`bg-gradient-to-r px-6 py-5 ${
          data.season.status === 'registration_open' 
            ? 'from-emerald-600 to-teal-700' 
            : 'from-indigo-600 to-indigo-700'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{data.season.name}</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {data.season.organization?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                data.season.status === 'active' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {data.season.status.replace('_', ' ')}
              </span>
              <Link 
                href={`/seasons/${data.season.id}`}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
              >
                View
              </Link>
            </div>
          </div>
          
          {/* Registration Info */}
          {(data.season.status === 'registration_open' || data.season.status === 'upcoming') && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-100 mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">Registration Info</span>
              </div>
              <p className="text-white font-medium text-sm">
                {mounted ? (
                  <>
                    Opens: {new Date(data.season.registration_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    <span className="mx-2 text-white/40">|</span>
                    Closes: {new Date(data.season.registration_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </>
                ) : '---'}
              </p>
            </div>
          )}
          
          {/* Progress Bar */}
          {data.season.status === 'active' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-indigo-100 mb-1">
                <span>{mounted ? new Date(data.season.season_start).toLocaleDateString() : '---'}</span>
                <span>{mounted ? `${progress}% Complete` : 'Calculating...'}</span>
                <span>{mounted ? new Date(data.season.season_end).toLocaleDateString() : '---'}</span>
              </div>
              <div className="w-full h-2 bg-indigo-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: mounted ? `${progress}%` : '0%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{data.stats.totalPlayers}</p>
            <p className="text-xs text-slate-500">Players</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{data.stats.totalMatches}</p>
            <p className="text-xs text-slate-500">Total Matches</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{data.stats.completedMatches}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{data.stats.pendingMatches}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
        </div>

        {/* Division Selector & Leaderboard */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Leaderboard</h3>
            <Link href="/leaderboard" className="text-sm text-indigo-600 hover:underline">View Full →</Link>
          </div>
          
          {/* Division Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {data.divisions.map((div) => (
              <button
                key={div.id}
                onClick={() => setSelectedDivisionId(div.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedDivisionId === div.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {DIVISION_LABELS[div.type] || div.name}
              </button>
            ))}
          </div>

          {/* Player's Rating Move */}
          {ratingMove && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🎾</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Rating Update!</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Recent Activity</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">TFR Rating</div>
                  <div className="text-2xl font-black text-indigo-600">
                    {Math.round(ratingMove.newRating)} 
                    <span className={`text-sm font-normal ml-2 ${ratingMove.newRating >= ratingMove.oldRating ? 'text-emerald-600' : 'text-red-600'}`}>
                      {ratingMove.newRating >= ratingMove.oldRating ? '↑' : '↓'}
                      {Math.abs(Math.round(ratingMove.newRating - ratingMove.oldRating))}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Updated
                </div>
              </div>
            </div>
          )}

          {/* Player's Standing */}
          {playerRank && !ratingMove && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Your Standing</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Season Progress</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Current Rank</div>
                  <div className="text-2xl font-black text-indigo-600">#{playerRank}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Current TFR</div>
                  <div className="text-lg font-black text-slate-900">
                    {playerTfr ? Math.round(playerTfr) : '--'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Division Pulse - Recent Results */}
          {data.divisionPulse && data.divisionPulse.length > 0 && (
            <div className="mb-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em]">Division Pulse</h3>
              </div>
              <div className="space-y-2">
                {data.divisionPulse.map((pulse) => (
                  <div key={pulse.id} className="flex items-center justify-between group">
                    <p className="text-sm text-slate-600 truncate">
                      <span className="font-bold text-slate-900">{pulse.winner_name}</span>
                      <span className="mx-1 text-slate-400 text-xs italic">def.</span>
                      {pulse.loser_name}
                    </p>
                    <span className="text-[10px] font-black bg-white px-1.5 py-0.5 rounded border border-slate-100 text-slate-500 ml-2">
                      {pulse.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stacked Leaderboards by Skill Level */}
          {loading ? (
            <div className="text-center py-4 text-slate-500 text-sm">Loading...</div>
          ) : !selectedDivisionId ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm">Select a division to view standings</p>
            </div>
          ) : Object.keys(leaderboardsBySkillLevel).length > 0 ? (
            <div className="space-y-4">
              {divisionSkillLevels.map((sl) => {
                const data = leaderboardsBySkillLevel[sl.id]
                if (!data || !data.leaderboard || data.leaderboard.length === 0) return null
                
                return (
                  <div key={sl.id}>
                    <p className="text-sm font-medium text-indigo-600 mb-1">{sl.name}</p>
                    <div className="space-y-1">
                      {data.leaderboard.map((entry: any, idx: number) => (
                        <div key={entry.player_id} className="flex items-center gap-2 text-sm">
                          <span className={`w-5 text-center font-medium ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {idx + 1}
                          </span>
                          <span className={`flex-1 truncate ${entry.player_id === playerId ? 'font-semibold text-indigo-600' : 'text-slate-900'}`}>
                            {entry.player_name}
                            {entry.player_id === playerId && (
                              <span className="text-xs text-indigo-500 ml-1">(You)</span>
                            )}
                          </span>
                          <span className="text-slate-500">{entry.wins}W-{entry.losses}L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No players yet in this division.</p>
          )}
        </div>
      </div>
    </div>
  )
}
