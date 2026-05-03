'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Flag {
  id: string
  reporter_id: string
  target_player_id: string
  reason: string
  status: 'pending' | 'reviewed' | 'upheld' | 'dismissed'
  coordinator_note: string | null
  created_at: string
  reviewed_at: string | null
  reporter?: { full_name: string }
  target_player?: {
    id: string
    tfr_singles: number
    tfr_doubles: number
    profile?: { full_name: string }
  }
}

export default function FlagsPage() {
  const router = useRouter()
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null)
  const [coordinatorNote, setCoordinatorNote] = useState('')
  const [newSinglesRating, setNewSinglesRating] = useState('')
  const [newDoublesRating, setNewDoublesRating] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadFlags()
  }, [statusFilter])

  async function loadFlags() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      
      const response = await fetch(`/api/flags?${params.toString()}`)
      if (response.redirected || response.status === 401) {
        router.push('/login')
        return
      }
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load flags')
      }
      
      const data = await response.json()
      setFlags(data.flags || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateFlag(flagId: string, status: string) {
    setUpdating(true)
    try {
      const body: any = { status }
      
      if (coordinatorNote) {
        body.coordinator_note = coordinatorNote
      }
      
      if (status === 'upheld') {
        if (newSinglesRating) {
          body.new_rating_singles = parseFloat(newSinglesRating) * 10
        }
        if (newDoublesRating) {
          body.new_rating_doubles = parseFloat(newDoublesRating) * 10
        }
      }
      
      const response = await fetch(`/api/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update flag')
      }
      
      setSelectedFlag(null)
      setCoordinatorNote('')
      setNewSinglesRating('')
      setNewDoublesRating('')
      loadFlags()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'reviewed': return 'bg-blue-100 text-blue-700'
      case 'upheld': return 'bg-red-100 text-red-700'
      case 'dismissed': return 'bg-slate-100 text-slate-500'
      default: return 'bg-slate-100 text-slate-500'
    }
  }

  function formatTFR(rating: number) {
    return Math.round(rating).toString()
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
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Rating Flag Review</h1>
          <p className="text-slate-600 mt-1">Review and manage anti-sandbagging reports</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['pending', 'reviewed', 'upheld', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading flags...</div>
        ) : flags.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <p className="text-slate-500">No flags found for this status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Target Player</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Reporter</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Reason</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(flag.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {flag.target_player?.profile?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-500">
                            TFR-S: {flag.target_player?.tfr_singles ? formatTFR(flag.target_player.tfr_singles) : '--'} 
                            {' • '}
                            TFR-D: {flag.target_player?.tfr_doubles ? formatTFR(flag.target_player.tfr_doubles) : '--'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {flag.reporter?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {flag.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(flag.status)}`}>
                          {flag.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedFlag(flag)
                            setCoordinatorNote(flag.coordinator_note || '')
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Flag Detail Modal */}
        {selectedFlag && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-900">Flag Review</h2>
                  <button
                    onClick={() => setSelectedFlag(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Target Player</p>
                  <p className="font-medium text-slate-900">
                    {selectedFlag.target_player?.profile?.full_name || 'Unknown'}
                  </p>
                  <div className="flex gap-4 mt-1 text-sm text-slate-600">
                    <span>TFR Singles: {selectedFlag.target_player?.tfr_singles ? formatTFR(selectedFlag.target_player.tfr_singles) : '--'}</span>
                    <span>TFR Doubles: {selectedFlag.target_player?.tfr_doubles ? formatTFR(selectedFlag.target_player.tfr_doubles) : '--'}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Reporter</p>
                  <p className="font-medium text-slate-900">
                    {selectedFlag.reporter?.full_name || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Reason</p>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                    {selectedFlag.reason}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedFlag.status)}`}>
                    {selectedFlag.status}
                  </span>
                </div>
                
                {selectedFlag.status === 'pending' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Coordinator Note
                      </label>
                      <textarea
                        value={coordinatorNote}
                        onChange={(e) => setCoordinatorNote(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        rows={3}
                        placeholder="Add notes about your review..."
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Update TFR Ratings (if upheld)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">New Singles TFR</label>
                          <input
                            type="number"
                            step="0.1"
                            min="2.5"
                            max="16.5"
                            value={newSinglesRating}
                            onChange={(e) => setNewSinglesRating(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="e.g. 3.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">New Doubles TFR</label>
                          <input
                            type="number"
                            step="0.1"
                            min="2.5"
                            max="16.5"
                            value={newDoublesRating}
                            onChange={(e) => setNewDoublesRating(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            placeholder="e.g. 3.5"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {selectedFlag.coordinator_note && (
                  <div>
                    <p className="text-sm text-slate-500">Coordinator Note</p>
                    <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                      {selectedFlag.coordinator_note}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedFlag.status === 'pending' && (
                <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
                  <button
                    onClick={() => handleUpdateFlag(selectedFlag.id, 'dismissed')}
                    disabled={updating}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleUpdateFlag(selectedFlag.id, 'reviewed')}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium disabled:opacity-50"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateFlag(selectedFlag.id, 'upheld')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    Uphold & Adjust Rating
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
