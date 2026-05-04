'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Match {
  id: string
  scheduled_at: string | null
  status: string
  skill_level_name: string
  division_type: string
  opponent_name: string
  h2h?: { wins: number, losses: number }
}

interface NextMatchHeroProps {
  match: Match
}

export default function NextMatchHero({ match }: NextMatchHeroProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const scheduledDate = match.scheduled_at ? new Date(match.scheduled_at) : null
  
  // Use a stable value for SSR, then update on client
  const isToday = mounted && scheduledDate ? scheduledDate.toDateString() === new Date().toDateString() : false

  return (
    <div className="mb-8 relative overflow-hidden bg-slate-900 rounded-3xl shadow-xl border border-slate-800">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              isToday 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isToday ? 'Match Today' : 'Next Match'}
            </span>
            {match.h2h && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                H2H: {match.h2h.wins}W - {match.h2h.losses}L
              </span>
            )}
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            vs {match.opponent_name}
          </h2>
          <p className="text-slate-400 font-medium text-lg">
            {match.skill_level_name} • {match.division_type.replace('_', ' ')}
          </p>
          
          <div className="flex items-center gap-6 mt-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</p>
              <p className="text-white font-bold">
                {mounted && scheduledDate ? scheduledDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'To be scheduled'}
              </p>
            </div>
            {scheduledDate && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time</p>
                <p className="text-white font-bold">
                  {mounted ? scheduledDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4">
          <Link 
            href={`/matches/${match.id}`}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
          >
            Match Hub
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <button 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all border border-white/10 backdrop-blur-sm"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location
          </button>
        </div>
      </div>
    </div>
  )
}
