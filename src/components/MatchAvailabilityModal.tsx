'use client'

import { useState, useEffect } from 'react'

interface AvailabilitySlot {
  date: string
  time_slots: string[]
}

interface Props {
  matchId: string | null
  onClose: () => void
}

const TIME_OPTIONS = [
  'Morning (8am-12pm)',
  'Afternoon (12pm-5pm)',
  'Evening (5pm-9pm)',
  'Night (9pm+)',
]

export default function MatchAvailabilityModal({ matchId, onClose }: Props) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
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
        setAvailability(data.availability || [])
      }
    } catch (e) {
      console.error('Failed to load availability:', e)
    } finally {
      setLoading(false)
    }
  }

  function toggleTime(time: string) {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time))
    } else {
      setSelectedTimes([...selectedTimes, time])
    }
  }

  async function handleSave() {
    if (!matchId || !selectedDate || selectedTimes.length === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/matches/${matchId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, time_slots: selectedTimes }),
      })
      if (res.ok) {
        const data = await res.json()
        setAvailability(data.availability || [])
        setSelectedDate('')
        setSelectedTimes([])
      }
    } catch (e) {
      console.error('Failed to save:', e)
    } finally {
      setSaving(false)
    }
  }

  if (!matchId) return null

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
                <h3 className="font-semibold text-slate-900 mb-3">Add Available Time</h3>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                   
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((time) => (
                      <button
                        key={time}
                        onClick={() => toggleTime(time)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedTimes.includes(time)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!selectedDate || selectedTimes.length === 0 || saving}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Add Availability'}
                  </button>
                </div>
              </div>

              {availability.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Your Available Times</h3>
                  <div className="space-y-2">
                    {availability.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-medium text-slate-900">
                          {new Date(slot.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {slot.time_slots.map((time: string, i: number) => (
                            <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                              {time}
                            </span>
                          ))}
                        </div>
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
