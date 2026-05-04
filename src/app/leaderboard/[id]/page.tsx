'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number
  player_name: string
  wins: number
  losses: number
  matches: number
  rating?: number
}

export default function SkillLevelLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: skillLevelId } = use(params)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [metadata, setMetadata] = useState<{ skillLevel: any, division: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/leaderboard/${skillLevelId}`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data.leaderboard || [])
          if (data.skillLevel) {
            setMetadata({
              skillLevel: data.skillLevel,
              division: data.division
            })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [skillLevelId])

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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/leaderboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center gap-1">
            ← Back to All Standings
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {metadata ? `${metadata.skillLevel.name} Rankings` : 'Full Rankings'}
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">
            {metadata?.division?.name || 'Tennis-Flex League'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading rankings...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No players found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboard.map((player) => (
                <div key={player.rank} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-6">
                    <span className={`w-8 text-xl font-black ${
                      player.rank === 1 ? 'text-amber-500' :
                      player.rank === 2 ? 'text-slate-400' :
                      player.rank === 3 ? 'text-orange-500' :
                      'text-slate-300'
                    }`}>
                      #{player.rank}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{player.player_name}</p>
                      <p className="text-sm text-slate-500">
                        {player.wins}W - {player.losses}L • {player.matches} matches
                      </p>
                    </div>
                  </div>
                  
                  {player.rating && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">TFR</p>
                      <p className="text-xl font-black text-indigo-600">{Math.round(player.rating)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
