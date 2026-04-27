'use client'

import { useState } from 'react'

interface FlagPlayerButtonProps {
  playerId: string
  playerName: string
  variant?: 'icon' | 'button'
}

export default function FlagPlayerButton({ playerId, playerName, variant = 'button' }: FlagPlayerButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_player_id: playerId,
          reason: reason.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit flag')
      }

      setSuccess(true)
      setReason('')
      setTimeout(() => {
        setShowModal(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={
          variant === 'icon'
            ? 'text-red-500 hover:text-red-700 transition-colors'
            : 'text-sm text-red-600 hover:text-red-700 font-medium'
        }
        title={`Flag ${playerName} for suspicious rating`}
      >
        {variant === 'icon' ? '🚩' : 'Flag Player'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">
                  Flag Player: {playerName}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {success ? (
              <div className="p-6 text-center">
                <div className="text-green-600 font-medium mb-2">Flag submitted successfully!</div>
                <p className="text-sm text-slate-500">A coordinator will review this report.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-4">
                    Report suspicious rating behavior for {playerName}. This will be reviewed by a coordinator.
                  </p>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason for Flag
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    rows={4}
                    placeholder="Describe why you believe this player's rating is suspicious..."
                    required
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !reason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Flag'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
