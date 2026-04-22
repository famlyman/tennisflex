'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Match {
  id: string
  status: string
  score: string | null
  scheduled_at: string | null
  home_player_id: string
  away_player_id: string
  home_player: {
    id: string
    tfr_singles: number
    profile: { full_name: string }
  }
  away_player: {
    id: string
    tfr_singles: number
    profile: { full_name: string }
  }
  winner_id: string | null
}

interface LeaderboardEntry {
  player_id: string
  player_name: string
  tfr_singles: number
  rank: number
  matches_played: number
  wins: number
  losses: number
  sets_won: number
  sets_lost: number
}

interface SkillLevelData {
  id: string
  name: string
  min_rating: number | null
  max_rating: number | null
  division: {
    name: string
    season: {
      id: string
      name: string
      organization: { name: string }
    }
  }
}

export default function SkillLevelPage({ params }: { params: Promise<{ id: string; skillLevelId: string }> }) {
  const [skillLevelId, setSkillLevelId] = useState<string | null>(null)
  const [data, setData] = useState<{
    skill_level: SkillLevelData
    matches: Match[]
    leaderboard: LeaderboardEntry[]
    isCoordinator: boolean
    userId: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard'>('matches')
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then(({ id, skillLevelId: slId }) => {
      setSkillLevelId(slId)
      loadData(slId)
    })
  }, [])

  async function loadData(id: string) {
    try {
      const response = await fetch(`/api/skill-levels/${id}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to load')
      }
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openScoreModal(match: Match) {
    setSelectedMatch(match)
    setScoreInput(match.score || '')
    setWinnerId(match.winner_id)
    setShowScoreModal(true)
  }

  async function handleScoreSubmit() {
    if (!selectedMatch || !scoreInput || !winnerId) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/matches/${selectedMatch.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: scoreInput, winner_id: winnerId }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit score')
      }
      setShowScoreModal(false)
      loadData(skillLevelId!)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500">{error || 'Not found'}</div>
      </div>
    )
  }

  const { skill_level, matches, leaderboard } = data
  const seasonId = skill_level.division?.season?.id

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
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <Link 
          href={`/seasons/${seasonId}`} 
          className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center"
        >
          ← Back to {skill_level.division?.season?.name}
        </Link>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{skill_level.name}</h1>
          <p className="text-slate-500 mt-1">
            {skill_level.division?.name} - {skill_level.division?.season?.organization?.name}
          </p>
          {skill_level.min_rating !== null && skill_level.max_rating !== null && (
            <p className="text-sm text-slate-400 mt-1">
              Rating Range: {skill_level.min_rating / 10} - {skill_level.max_rating / 10}
            </p>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'matches'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Leaderboard ({leaderboard.length})
          </button>
        </div>

        {activeTab === 'matches' ? (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No matches scheduled yet.</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      match.status === 'completed' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : match.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {match.status === 'completed' ? 'Completed' : 
                       match.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
                    </span>
                    <div className="flex items-center gap-3">
                      {match.scheduled_at && (
                        <span className="text-sm text-slate-500">
                          {new Date(match.scheduled_at).toLocaleDateString()}
                        </span>
                      )}
                      {(data?.isCoordinator || match.home_player_id === data?.userId || match.away_player_id === data?.userId) && match.status !== 'completed' && (
                        <button
                          onClick={() => openScoreModal(match)}
                          className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700"
                        >
                          Add Score
                        </button>
                      )}
                      {(data?.isCoordinator || match.home_player_id === data?.userId || match.away_player_id === data?.userId) && match.status === 'completed' && (
                        <button
                          onClick={() => openScoreModal(match)}
                          className="text-sm bg-slate-200 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-300"
                        >
                          Edit Score
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-right">
                      <div className={`font-medium ${match.winner_id === match.home_player?.id ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                        {match.home_player?.profile?.full_name}
                        {match.winner_id === match.home_player?.id && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Winner</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        TFR: {(match.home_player?.tfr_singles / 10).toFixed(1)}
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-slate-100 rounded-xl text-center">
                      {match.status === 'completed' && match.score ? (
                        <div className="font-bold text-lg text-slate-900">{match.score}</div>
                      ) : (
                        <div className="text-slate-400">vs</div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className={`font-medium ${match.winner_id === match.away_player?.id ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                        {match.away_player?.profile?.full_name}
                        {match.winner_id === match.away_player?.id && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Winner</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        TFR: {(match.away_player?.tfr_singles / 10).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Rank</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Player</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-500">Rating</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-slate-500">W</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-slate-500">L</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-slate-500">Sets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No players yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr key={entry.player_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          entry.rank === 1 
                            ? 'bg-yellow-100 text-yellow-700'
                            : entry.rank === 2
                            ? 'bg-slate-200 text-slate-600'
                            : entry.rank === 3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {entry.player_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {(entry.tfr_singles / 10).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-emerald-600">
                        {entry.wins}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-red-600">
                        {entry.losses}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">
                        {entry.sets_won}-{entry.sets_lost}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showScoreModal && selectedMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                {selectedMatch.status === 'completed' ? 'Edit Score' : 'Submit Score'}
              </h3>
              
              <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="text-center">
                  <div className="font-medium text-slate-900">{selectedMatch.home_player?.profile?.full_name}</div>
                  <div className="text-sm text-slate-500">TFR: {(selectedMatch.home_player?.tfr_singles / 10).toFixed(1)}</div>
                </div>
                <div className="text-slate-400">vs</div>
                <div className="text-center">
                  <div className="font-medium text-slate-900">{selectedMatch.away_player?.profile?.full_name}</div>
                  <div className="text-sm text-slate-500">TFR: {(selectedMatch.away_player?.tfr_singles / 10).toFixed(1)}</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Score</label>
                <input
                  type="text"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  placeholder="e.g., 6-3 6-4 6-3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                <p className="text-xs text-slate-500 mt-1">Format: 6-3 6-4 6-3 (each set, with optional tiebreak scores)</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Winner</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWinnerId(selectedMatch.home_player_id)}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium ${
                      winnerId === selectedMatch.home_player_id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {selectedMatch.home_player?.profile?.full_name}
                  </button>
                  <button
                    onClick={() => setWinnerId(selectedMatch.away_player_id)}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium ${
                      winnerId === selectedMatch.away_player_id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {selectedMatch.away_player?.profile?.full_name}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-lg font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreSubmit}
                  disabled={!scoreInput || !winnerId || submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save Score'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}