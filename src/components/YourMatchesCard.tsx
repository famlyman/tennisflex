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
    color: #111827;
    font-size: 1.125rem;
    font-weight: 700;
  }
  .dark-calendar .react-calendar__navigation button:enabled:hover,
  .dark-calendar .react-calendar__navigation button:enabled:focus {
    background-color: #f3f4f6;
    border-radius: 0.375rem;
  }
  .dark-calendar .react-calendar__navigation__arrow {
    font-size: 1.5rem;
    color: #111827;
    font-weight: 700;
  }
  .dark-calendar .react-calendar__month-view__weekdays {
    font-size: 0.75rem;
    font-weight: 700;
    color: #111827;
    text-transform: uppercase;
  }
  .dark-calendar .react-calendar__tile {
    color: #111827;
    font-weight: 600;
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
  scheduled_at: string | null
  status: string
  skill_level_name: string
  skill_level_id?: string
  division_type: string
  opponent_name: string
  opponent_id?: string
  season_id?: string
}

interface YourMatchesCardProps {
  matches: Match[]
  playerId?: string
}

export default function YourMatchesCard({ matches, playerId }: YourMatchesCardProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [myAvailability, setMyAvailability] = useState<{date: string, note: string}[]>([])
  const [opponentAvailability, setOpponentAvailability] = useState<{date: string, note: string}[]>([])
  const [opponentName, setOpponentName] = useState('Opponent')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  async function openAvailability(match: Match) {
    setSelectedMatch(match)
    setLoading(true)

    try {
      // Get my availability
      const myRes = await fetch('/api/player/availability')
      if (myRes.ok) {
        const myData = await myRes.json()
        setMyAvailability(myData.availability || [])
      }

      // Get opponent's availability
      if (match.opponent_id) {
        const oppRes = await fetch(`/api/player/availability?player_id=${match.opponent_id}`)
        if (oppRes.ok) {
          const oppData = await oppRes.json()
          setOpponentAvailability(oppData.availability || [])
        }
        setOpponentName(match.opponent_name)
      }
    } catch (e) {
      console.error('Failed to load availability:', e)
    } finally {
      setLoading(false)
    }
  }

  function toggleDate(date: string) {
    const existing = myAvailability.find(d => d.date === date)
    if (existing) {
      setMyAvailability(myAvailability.filter(d => d.date !== date))
    } else {
      setMyAvailability([...myAvailability, { date, note: '' }])
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const dates = myAvailability.map(d => d.date)
      const notes: {[key: string]: string} = {}
      if (note) {
        dates.forEach(d => {
          notes[d] = note
        })
      }
      
      const res = await fetch('/api/player/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates, notes }),
      })
      if (res.ok) {
        const data = await res.json()
        setMyAvailability(data.availability || [])
      }
    } catch (e) {
      console.error('Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  if (matches.length === 0) {
    return null
  }

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Matches</h3>
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
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
                  onClick={() => openAvailability(match)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Set Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Match Availability</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    vs {selectedMatch.opponent_name} • {selectedMatch.skill_level_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-slate-900 hover:text-slate-600"
                >
                  <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Select Available Dates</h3>
                     <div className="dark-calendar">
                       <Calendar
                         key={JSON.stringify(myAvailability.map(d => d.date))}
                         locale="en-US"
                         onClickDay={(value) => {
                           const d = new Date(value)
                           const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                           toggleDate(dateStr)
                         }}
                         tileClassName={({ date }) => {
                           const d = new Date(date)
                           const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                           const myDate = myAvailability.some(d => d.date === dateStr)
                           const opponentDate = opponentAvailability.some(d => d.date === dateStr)

                           if (myDate && opponentDate) {
                             return 'bg-purple-300 text-purple-900 font-bold rounded border-2 border-purple-500'
                           }
                           if (myDate) {
                             return 'bg-indigo-200 text-indigo-900 font-bold rounded'
                           }
                           if (opponentDate) {
                             return 'bg-emerald-200 text-emerald-900 font-bold rounded'
                           }
                           return 'text-gray-900'
                         }}
                         minDate={new Date()}
                       />
                     </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                        <span className="text-gray-800">Your availability</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-emerald-600 rounded"></div>
                        <span className="text-gray-800">{opponentName}'s availability</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-600 rounded border border-purple-800"></div>
                        <span className="text-gray-800">Both available</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Availability'}
                    </button>
                  </div>

                  {opponentAvailability.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">{opponentName}'s Availability</h3>
                      <div className="space-y-2">
                        {opponentAvailability.map((item, idx) => (
                          <div key={idx} className="p-3 bg-emerald-50 rounded-lg">
                            <p className="font-medium text-slate-900">
                              {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            {item.note && (
                              <p className="text-sm text-slate-600 mt-1">{item.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Your Available Dates:</h4>
                    {myAvailability.length === 0 ? (
                      <p className="text-sm text-slate-500">No dates selected yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {myAvailability.sort((a, b) => a.date.localeCompare(b.date)).map((item) => {
                          const d = new Date(item.date + 'T00:00:00')
                          return (
                            <span key={item.date} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center gap-2">
                              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              <button
                                onClick={() => {
                                  setMyAvailability(myAvailability.filter(d => d.date !== item.date))
                                }}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Notes (applies to all your available dates)
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g., evenings work best..."
                        className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={3}
                      />
                     </div>
                   </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedMatch(null)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Close
                    </button>
                    {selectedMatch.season_id && selectedMatch.skill_level_id && (
                      <Link
                        href={`/seasons/${selectedMatch.season_id}/skill-level/${selectedMatch.skill_level_id}`}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
                      >
                        View Matches
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
