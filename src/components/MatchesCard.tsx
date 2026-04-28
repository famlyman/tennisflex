'use client'

import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

const calendarStyles = `
  .dark-calendar .react-calendar {
    width: 100%;
    border: none;
    font-family: inherit;
  }
  .dark-calendar .react-calendar__navigation {
    margin-bottom: 1rem;
  }
  .dark-calendar .react-calendar__navigation button {
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
  }
  .dark-calendar .react-calendar__navigation button:enabled:hover,
  .dark-calendar .react-calendar__navigation button:enabled:focus {
    background-color: #f3f4f6;
    border-radius: 0.375rem;
  }
  .dark-calendar .react-calendar__navigation__arrow {
    font-size: 1.5rem;
    color: #4b5563;
  }
  .dark-calendar .react-calendar__month-view__weekdays {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
  }
  .dark-calendar .react-calendar__tile {
    color: #111827;
    font-weight: 500;
  }
  .dark-calendar .react-calendar__tile:enabled:hover,
  .dark-calendar .react-calendar__tile:enabled:focus {
    background-color: #e0e7ff;
    border-radius: 0.375rem;
  }
  .dark-calendar .react-calendar__tile--now {
    font-weight: 700;
    color: #4338ca;
  }
`

interface Match {
  id: string
  opponent_name: string
  status: string
  score: string
  winner_id: string
  home_player_id: string
  away_player_id: string
  skill_level?: {
    id: string
    division?: {
      id: string
      name: string
      season?: {
        id: string
      }
    }
  }
  player?: {
    id: string
  }
}

interface MatchesCardProps {
  matches: Match[]
  playerId: string
}

export default function MatchesCard({ matches, playerId }: MatchesCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [matchAvailability, setMatchAvailability] = useState<string[]>([])
  const [opponentAvailability, setOpponentAvailability] = useState<any[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const supabaseClient = getSupabaseClient()

  const openMatchModal = async (match: Match) => {
    setSelectedMatch(match)
    setLoadingAvailability(true)
    
    try {
      const res = await fetch(`/api/matches/${encodeURIComponent(match.id)}/availability`)
      const data = await res.json()
      setMatchAvailability(data.myAvailability || [])
      setOpponentAvailability(data.opponentAvailability || [])
    } catch (err) {
      console.error('Failed to load availability:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const saveAvailability = async (dates: string[]) => {
    if (!selectedMatch) return
    
    try {
      await fetch(`/api/matches/${encodeURIComponent(selectedMatch.id)}/availability}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      })
      setMatchAvailability(dates)
    } catch (err) {
      console.error('Failed to save availability:', err)
    }
  }

  const handleDateClick = (value: any) => {
    const dateStr = new Date(value).toISOString().split('T')[0]
    const newDates = matchAvailability.includes(dateStr)
      ? matchAvailability.filter(d => d !== dateStr)
      : [...matchAvailability, dateStr]
    setMatchAvailability(newDates)
    saveAvailability(newDates)
  }

  const completedMatches = matches.filter(m => m.status === 'completed').length
  const scheduledMatches = matches.filter(m => m.status !== 'completed').length

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Matches</h3>
          <span className="text-sm text-slate-500">
            {completedMatches} completed, {scheduledMatches} scheduled
          </span>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
                    {matches.map((match) => {
                      const isHome = match.home_player_id === playerId
                      const isWinner = match.winner_id === playerId
                      const isCompleted = match.status === 'completed'
                      
                      return (
                        <div 
                          key={match.id} 
                          className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${isCompleted ? 'bg-white border-gray-300' : 'bg-blue-50 border-blue-200'}`}
                          onClick={() => openMatchModal(match)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isCompleted ? (isWinner ? 'bg-emerald-700' : 'bg-red-700') : 'bg-blue-700'}`}></span>
                                <p className="text-sm font-bold text-gray-900">
                                  vs {match.opponent_name || 'Unknown'}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 mt-0.5">
                                {match.skill_level?.division?.name || 'Unknown division'} • {' '}
                                {isCompleted ? 'Completed' : 'Scheduled'}
                              </p>
                            </div>
                            <div className="text-right">
                              {isCompleted && match.score ? (
                                <div>
                                  <p className={`text-base font-bold ${isWinner ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {match.score}
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {isWinner ? 'Won' : 'Lost'}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded">
                                  Scheduled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
        </div>
      </div>

      {/* Match Availability Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Match Availability</h3>
                <p className="text-sm text-slate-500 mt-1">
                  vs {selectedMatch.opponent_name} • {selectedMatch.skill_level?.division?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingAvailability ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Select dates you're available:</p>
                      <div className="dark-calendar">
                        <Calendar
                          onClickDay={handleDateClick}
                          className="dark-calendar"
                          tileClassName={({ date }) => {
                            const dateStr = date.toISOString().split('T')[0]
                            if (matchAvailability.includes(dateStr)) {
                              return 'bg-indigo-200 text-indigo-900 font-bold rounded'
                            }
                            if (opponentAvailability.some((a: any) => a.date === dateStr)) {
                              return 'bg-emerald-200 text-emerald-900 font-bold rounded'
                            }
                            return 'text-gray-900'
                          }}
                        />
                      </div>
                  <div className="flex gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                      <span className="text-gray-800">Your availability</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                      <span className="text-gray-800">{opponentAvailability[0]?.player_name || 'Opponent'}'s availability</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Your Available Dates:</h4>
                  {matchAvailability.length === 0 ? (
                    <p className="text-sm text-slate-500">No dates selected yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {matchAvailability.sort().map((date: string) => (
                        <span key={date} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => setSelectedMatch(null)}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            Close
                          </button>
                          {selectedMatch.skill_level?.division?.season?.id && selectedMatch.skill_level?.id && (
                            <Link
                              href={`/seasons/${selectedMatch.skill_level.division.season.id}/skill-level/${selectedMatch.skill_level.id}`}
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
                            >
                              View Match
                            </Link>
                          )}
                        </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
