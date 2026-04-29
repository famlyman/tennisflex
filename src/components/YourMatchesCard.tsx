'use client'

import { useState } from 'react'
import MatchAvailabilityModal from './MatchAvailabilityModal'

interface Match {
  id: string
  scheduled_at: string | null
  status: string
  skill_level_name: string
  division_type: string
  opponent_name: string
}

interface YourMatchesCardProps {
  matches: Match[]
}

export default function YourMatchesCard({ matches }: YourMatchesCardProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openAvailability(matchId: string) {
    setSelectedMatchId(matchId)
    setIsModalOpen(true)
  }

  if (matches.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Matches</h3>
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 text-sm">
                    vs {match.opponent_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {match.skill_level_name} • {match.division_type?.replace('_', ' ')}
                  </p>
                  {match.scheduled_at && (
                    <p className="text-xs text-slate-400 mt-1">
                      Scheduled: {new Date(match.scheduled_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openAvailability(match.id)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Set Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <MatchAvailabilityModal
          matchId={selectedMatchId}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedMatchId(null)
          }}
        />
      )}
    </>
  )
}
