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
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [selectedDivision, setSelectedDivision] = useState<string>('')
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSeasons()
  }, [])

  useEffect(() => {
    if (selectedSeason) {
      loadDivisions(selectedSeason)
    }
  }, [selectedSeason])

  useEffect(() => {
    if (selectedDivision) {
      loadSkillLevels(selectedDivision)
    }
  }, [selectedDivision])

  useEffect(() => {
    if (selectedSkillLevel) {
      loadLeaderboard(selectedSkillLevel)
    }
  }, [selectedSkillLevel])

  async function loadSeasons() {
    try {
      const res = await fetch('/api/leaderboard/seasons')
      const data = await res.json()
      setSeasons(data.seasons || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadDivisions(seasonId: string) {
    try {
      const res = await fetch(`/api/leaderboard/divisions?season_id=${seasonId}`)
      const data = await res.json()
      setDivisions(data.divisions || [])
      setSelectedDivision('')
      setSkillLevels([])
      setLeaderboard([])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadSkillLevels(divisionId: string) {
    try {
      const res = await fetch(`/api/leaderboard/skill-levels?division_id=${divisionId}`)
      const data = await res.json()
      setSkillLevels(data.skill_levels || [])
      setSelectedSkillLevel('')
      setLeaderboard([])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadLeaderboard(skillLevelId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard/${skillLevelId}`)
      if (!res.ok) {
        const data = await res.json()
        console.error('Leaderboard error:', data)
        setLeaderboard([])
        return
      }
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Tennis-Flex</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboards</h1>
          <p className="text-slate-600 mt-1">Select a division to view rankings</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
            >
              <option value="">Select season...</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {s.organization?.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              disabled={!selectedSeason}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:opacity-50"
            >
              <option value="">Select division...</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Skill Level</label>
            <select
              value={selectedSkillLevel}
              onChange={(e) => setSelectedSkillLevel(e.target.value)}
              disabled={!selectedDivision}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 disabled:opacity-50"
            >
              <option value="">Select level...</option>
              {skillLevels.map((sl) => (
                <option key={sl.id} value={sl.id}>{sl.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Rankings</h2>
            <p className="text-sm text-slate-500">Top 20 by wins</p>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {selectedSkillLevel ? 'No players yet in this division.' : 'Select a skill level to view rankings.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((player: LeaderboardEntry) => (
                <div key={player.rank} className="p-4 flex items-center">
                  <div className="w-12 text-lg font-bold text-slate-400">#{player.rank}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{player.player_name}</p>
                    <p className="text-sm text-slate-500">
                      {player.wins}W - {player.losses}L • {player.matches} matches
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}