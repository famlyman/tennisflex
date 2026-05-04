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

interface SeasonHubData {
  season: {
    id: string
    name: string
    status: string
    season_start: string
    season_end: string
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
  const [selectedSkillLevelId, setSelectedSkillLevelId] = useState<string>(data.playerSkillLevelId || '')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [playerRank, setPlayerRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Get skill levels for selected division
  const divisionSkillLevels = selectedDivisionId 
    ? data.skillLevels.filter(sl => sl.division_id === selectedDivisionId)
    : data.skillLevels // Show all if no division selected

  // Fetch leaderboards for all skill levels in the division
  useEffect(() => {
    if (divisionSkillLevels.length > 0) {
      fetchAllLeaderboards(divisionSkillLevels)
    } else {
      setLeaderboardsBySkillLevel({})
      setPlayerRank(null)
    }
  }, [selectedDivisionId])

  const [leaderboardsBySkillLevel, setLeaderboardsBySkillLevel] = useState<Record<string, any>>({})

  async function fetchAllLeaderboards(skillLevels: SkillLevel[]) {
    setLoading(true)
    try {
      const results: Record<string, any> = {}
      let playerRankFound: number | null = null

      for (const sl of skillLevels) {
        const res = await fetch(`/api/leaderboard/${sl.id}`)
        if (res.ok) {
          const data = await res.json()
          results[sl.id] = {
            skillLevel: sl,
            leaderboard: data.leaderboard || [],
          }
          // Find player rank
          if (!playerRankFound) {
            const rank = data.leaderboard?.findIndex((e: any) => e.player_id === playerId)
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

  // Calculate progress
  const now = new Date().getTime()
  const start = new Date(data.season.season_start).getTime()
  const end = new Date(data.season.season_end).getTime()
  const progress = Math.min(100, Math.round(((now - start) / (end - start)) * 100))

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Season Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{data.season.name}</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {data.season.organization?.name}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              data.season.status === 'active' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-200 text-slate-700'
            }`}>
              {data.season.status.replace('_', ' ')}
            </span>
          </div>
          
          {/* Progress Bar */}
          {data.season.status === 'active' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-indigo-100 mb-1">
                <span>{new Date(data.season.season_start).toLocaleDateString()}</span>
                <span>{progress}% Complete</span>
                <span>{new Date(data.season.season_end).toLocaleDateString()}</span>
              </div>
              <div className="w-full h-2 bg-indigo-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress}%` }}
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
            <button
              onClick={() => setSelectedDivisionId('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedDivisionId === '' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Divisions
            </button>
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

          {/* Player's Standing */}
          {playerRank && (
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-indigo-600 font-medium mb-1">Your Standing</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">#{playerRank}</p>
                  <p className="text-xs text-slate-500">
                    Overall across all divisions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {playerTfr ? Math.round(playerTfr) : '--'} TFR
                  </p>
                  <p className="text-xs text-slate-500">
                    {playerMatches || 0} matches
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stacked Leaderboards by Skill Level */}
          {loading ? (
            <div className="text-center py-4 text-slate-500 text-sm">Loading...</div>
          ) : Object.keys(leaderboardsBySkillLevel).length > 0 ? (
            <div className="space-y-4">
              {divisionSkillLevels.map((sl) => {
                const data = leaderboardsBySkillLevel[sl.id]
                if (!data || !data.leaderboard || data.leaderboard.length === 0) return null
                
                return (
                  <div key={sl.id}>
                    <p className="text-sm font-medium text-indigo-600 mb-2">{sl.name}</p>
                    <div className="space-y-1">
                      {data.leaderboard.slice(0, 5).map((entry: any, idx: number) => (
                        <div key={entry.player_id} className="flex items-center gap-2 text-sm">
                          <span className={`w-5 text-center font-medium ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {idx + 1}
                          </span>
                          <span className={`flex-1 truncate ${entry.player_id === playerId ? 'font-semibold text-indigo-600' : 'text-slate-900'}`}>
                            {entry.player_name}
                          </span>
                          <span className="text-slate-500">{entry.wins}W-{entry.losses}L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : selectedDivisionId ? (
            <p className="text-slate-500 text-sm text-center py-4">No players yet in this division.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
