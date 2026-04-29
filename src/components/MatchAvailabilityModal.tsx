'use client'

import { useState, useEffect } from 'react'

interface Props {
  matchId: string | null
  onClose: () => void
}

export default function MatchAvailabilityModal({ matchId, onClose }: Props) {
  const [myAvailability, setMyAvailability] = useState<string[]>([])
  const [opponentAvailability, setOpponentAvailability] = useState<{date: string, player_name: string}[]>([])
  const [opponentName, setOpponentName] = useState('Opponent')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (matchId) loadAvailability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId])

  async function loadAvailability() {
    if (!matchId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/matches/${matchId}/availability`)
      if (res.ok) {
        const data = await res.json()
        setMyAvailability(data.myAvailability || [])
        setOpponentAvailability(data.opponentAvailability || [])
        setOpponentName(data.opponentName || 'Opponent')
        setSelectedDates(data.myAvailability || [])
      }
    } catch (e) {
      console.error('Failed to load availability:', e)
    } finally {
      setLoading(false)
    }
  }

  function toggleDate(date: string) {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date))
    } else {
      setSelectedDates([...selectedDates, date])
    }
  }

  async function handleSave() {
    if (!matchId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/matches/${matchId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: selectedDates }),
      })
      if (res.ok) {
        const data = await res.json()
        setMyAvailability(selectedDates)
        setOpponentAvailability(data.opponentAvailability || [])
      }
    } catch (e) {
      console.error('Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  if (!matchId) return null

  const today = new Date().toISOString().split('T')[0]
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Match Availability</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Select Available Dates</h3>
                <div className="grid grid-cols-2 gap-2">
                  {next14Days.map((date) => (
                    <button
                      key={date}
                      onClick={() => toggleDate(date)}
                      disabled={date < today}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDates.includes(date)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </button>
                  ))}
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
                    {opponentAvailability.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 rounded-lg">
                        <p className="font-medium text-slate-900">
                          {new Date(slot.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
