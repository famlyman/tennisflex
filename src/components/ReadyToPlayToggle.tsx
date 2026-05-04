'use client'

import { useState } from 'react'

interface ReadyToPlayToggleProps {
  initialStatus: boolean
  playerId: string
}

export default function ReadyToPlayToggle({ initialStatus, playerId }: ReadyToPlayToggleProps) {
  const [isReady, setIsReady] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  async function toggleStatus() {
    setLoading(true)
    const newStatus = !isReady
    try {
      // We'll use a generic player update API if it exists, or create a targeted one
      const res = await fetch(`/api/player/ready-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, isReady: newStatus })
      })
      
      if (res.ok) {
        setIsReady(newStatus)
      } else {
        console.error('Failed to update status')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button 
        onClick={toggleStatus}
        disabled={loading}
        className={`relative inline-flex items-center gap-3 px-4 py-2 rounded-2xl transition-all border ${
          isReady 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' 
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
        <span className="text-xs font-black uppercase tracking-widest">
          {isReady ? 'Ready to Play' : 'Taking a Break'}
        </span>
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </button>
      <p className="text-[10px] font-medium text-slate-400 max-w-[140px] text-right leading-tight">
        {isReady 
          ? 'Opponents see you are actively seeking matches.' 
          : 'Hides you from scheduling for the week.'}
      </p>
    </div>
  )
}
