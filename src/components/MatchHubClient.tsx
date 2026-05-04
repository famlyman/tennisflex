'use client'

import { useState, useEffect, useRef } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

// Helper to format dates
const formatDate = (date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', options).format(d)
}

const formatISO = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    full_name: string
  }
}

interface Availability {
  date: string
  note: string
}

interface MatchHubClientProps {
  match: any
  currentUserId: string
  currentPlayerId: string
  opponent: any
}

const calendarStyles = `
  .hub-calendar .react-calendar {
    width: 100%;
    border: none;
    font-family: inherit;
    background: transparent;
  }
  .hub-calendar .react-calendar__navigation {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .hub-calendar .react-calendar__navigation button {
    color: #0f172a;
    font-size: 1.125rem;
    font-weight: 700;
    min-width: 44px;
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .hub-calendar .react-calendar__navigation button:enabled:hover {
    background-color: #f1f5f9;
  }
  .hub-calendar .react-calendar__month-view__weekdays {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .hub-calendar .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
  }
  .hub-calendar .react-calendar__tile {
    padding: 12px 8px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.875rem;
    color: #1e293b;
    border: 2px solid transparent;
    transition: all 0.2s;
    height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .hub-calendar .react-calendar__tile--now {
    background: #f8fafc !important;
    color: #4f46e5 !important;
    text-decoration: underline;
  }
  .hub-calendar .react-calendar__tile:enabled:hover {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
  }
  .hub-calendar .react-calendar__tile--active {
    background: transparent !important;
    color: inherit !important;
  }
  .hub-calendar .availability-me {
    background-color: #e0e7ff !important;
    color: #3730a3 !important;
    border-color: #c7d2fe !important;
  }
  .hub-calendar .availability-opp {
    background-color: #dcfce7 !important;
    color: #166534 !important;
    border-color: #bbf7d0 !important;
  }
  .hub-calendar .availability-both {
    background-color: #f3e8ff !important;
    color: #6b21a8 !important;
    border-color: #e9d5ff !important;
    font-weight: 800;
    box-shadow: 0 0 0 2px #d8b4fe;
  }
  .hub-calendar .scheduled-date {
    background-color: #4f46e5 !important;
    color: white !important;
    border-color: #4338ca !important;
    box-shadow: 0 4px 6px -1px rgb(79 70 229 / 0.2);
  }
`

export default function MatchHubClient({ match, currentUserId, currentPlayerId, opponent }: MatchHubClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [myAvailability, setMyAvailability] = useState<Availability[]>([])
  const [opponentAvailability, setOpponentAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [setScores, setSetScores] = useState<{ home: string; away: string }[]>([
    { home: '', away: '' },
    { home: '', away: '' },
    { home: '', away: '' },
  ])
  const [winnerId, setWinnerId] = useState<string | null>(match.winner_id)
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (match.score) {
      const sets = match.score.split(' ').map((set: string) => {
        const parts = set.includes('(') ? set.split('(')[0] : set
        const [home, away] = parts.split('-')
        return { home: home.trim(), away: away.trim() }
      })
      const finalSets = [...sets]
      while (finalSets.length < 3) finalSets.push({ home: '', away: '' })
      setSetScores(finalSets.slice(0, 3))
    }
  }, [match.score])

  const updateSetScore = (index: number, side: 'home' | 'away', value: string) => {
    const newScores = [...setScores]
    newScores[index] = { ...newScores[index], [side]: value }
    setSetScores(newScores)
  }

  async function handleScoreSubmit() {
    if (!winnerId || submittingScore) return
    
    const scoreString = setScores
      .filter(s => s.home && s.away)
      .map(s => `${s.home}-${s.away}`)
      .join(' ')
    
    if (!scoreString) {
      alert('Please enter at least one set score')
      return
    }
    
    setSubmittingScore(true)
    try {
      const response = await fetch(`/api/matches/${match.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: scoreString, winner_id: winnerId }),
      })
      
      if (response.ok) {
        window.location.reload()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to submit score')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while saving the score')
    } finally {
      setSubmittingScore(false)
    }
  }

  useEffect(() => {
    loadData()

    // Subscribe to new messages
    const channel = supabase
      .channel(`match_messages_${match.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${match.id}`
        },
        async (payload: { new: { id: string } }) => {
          // Fetch the full message with sender profile
          const { data: fullMsg } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
            .eq('id', payload.new.id)
            .single()
          
          if (fullMsg) {
            setMessages((prev) => [...prev, fullMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadData() {
    setLoading(true)
    try {
      // Load messages
      const msgRes = await fetch(`/api/messages?match_id=${match.id}`)
      const msgData = await msgRes.json()
      setMessages(msgData.messages || [])

      // Load my availability
      const myAvailRes = await fetch('/api/player/availability')
      const myAvailData = await myAvailRes.json()
      setMyAvailability(myAvailData.availability || [])

      // Load opponent's availability
      const oppAvailRes = await fetch(`/api/player/availability?player_id=${opponent.id}`)
      const oppAvailData = await oppAvailRes.json()
      setOpponentAvailability(oppAvailData.availability || [])
    } catch (err) {
      console.error('Failed to load hub data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages?match_id=${match.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })
      if (res.ok) {
        setNewMessage('')
        // Immediate local refresh to ensure visibility even if real-time lags
        const msgRes = await fetch(`/api/messages?match_id=${match.id}`)
        const msgData = await msgRes.json()
        if (msgData.messages) setMessages(msgData.messages)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  async function toggleAvailability(dateStr: string) {
    const isAvailable = myAvailability.some(a => a.date === dateStr)
    let newAvail: Availability[]
    
    if (isAvailable) {
      newAvail = myAvailability.filter(a => a.date !== dateStr)
    } else {
      newAvail = [...myAvailability, { date: dateStr, note: '' }]
    }

    setMyAvailability(newAvail)

    // Save to API
    try {
      await fetch('/api/player/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dates: newAvail.map(a => a.date),
          notes: Object.fromEntries(newAvail.map(a => [a.date, a.note]))
        })
      })
    } catch (err) {
      console.error('Failed to save availability:', err)
    }
  }

  async function scheduleMatch(dateStr: string) {
    const displayDate = formatDate(dateStr + 'T12:00:00', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!confirm(`Schedule this match for ${displayDate}?`)) return

    setScheduling(true)
    try {
      const res = await fetch(`/api/matches/${match.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: `${dateStr}T12:00:00Z` })
      })
      
      if (res.ok) {
        window.location.reload()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to schedule match')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred while scheduling')
    } finally {
      setScheduling(false)
    }
  }

  const getTileClassName = ({ date }: { date: Date }) => {
    const dStr = formatISO(date)
    const isMe = myAvailability.some(a => a.date === dStr)
    const isOpp = opponentAvailability.some(a => a.date === dStr)
    const isScheduled = match.scheduled_at?.startsWith(dStr)

    if (isScheduled) return 'scheduled-date'
    if (isMe && isOpp) return 'availability-both'
    if (isMe) return 'availability-me'
    if (isOpp) return 'availability-opp'
    return ''
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      <style>{calendarStyles}</style>
      
      {/* Left Column: Calendar & Info */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Coordination Calendar</h2>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-indigo-200 border border-indigo-300 rounded"></div>
                <span>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div>
                <span>{opponent.profile?.full_name?.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                <span>Overlap</span>
              </div>
            </div>
          </div>

          <div className="hub-calendar">
            {mounted ? (
              <Calendar
                onClickDay={(value) => {
                  if (value instanceof Date) {
                    const dStr = formatISO(value)
                    if (match.status === 'completed') return
                    toggleAvailability(dStr)
                  }
                }}
                tileClassName={getTileClassName}
                minDate={new Date()}
                locale="en-US"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 text-sm">Loading calendar...</p>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Instructions</h3>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Click a date to mark yourself as available.</li>
              <li>Coordinate the specific time in the chat.</li>
              <li>Once you agree, click an <span className="text-purple-600 font-bold">Overlap</span> date and select "Confirm Time".</li>
            </ul>
          </div>
        </div>

        {/* Selected Date Actions */}
        {match.status !== 'completed' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  const overlap = myAvailability.find(a => opponentAvailability.some(o => o.date === a.date))
                  if (overlap) scheduleMatch(overlap.date)
                  else alert('Select an overlapping date first!')
                }}
                disabled={scheduling}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-indigo-900">Schedule Best Date</span>
              </button>

              <button 
                onClick={() => setShowScoreModal(true)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-emerald-900">
                  {match.status === 'completed' ? 'Edit Score' : 'Submit Score'}
                </span>
              </button>

              {match.status === 'completed' && !match.verified_by_opponent && (
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/matches/${match.id}/verify`, { method: 'POST' });
                      if (res.ok) window.location.reload();
                      else alert('Failed to verify score');
                    } catch (err) {
                      alert('Error verifying score');
                    }
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-blue-900">Verify Score</span>
                </button>
              )}
              
              <Link 
                href={`/seasons/${match.skill_level?.division?.season_id}`}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-900">View Division</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Chat */}
      <div className="lg:col-span-5 h-[calc(100vh-200px)] min-h-[600px] sticky top-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {opponent.profile?.full_name?.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{opponent.profile?.full_name}</h3>
              <p className="text-xs text-slate-500">TFR: {Math.round(opponent.tfr_singles)} • Singles</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-medium">No messages yet. Say hello to start coordinating!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUserId
                const showSender = idx === 0 || messages[idx-1].sender_id !== msg.sender_id
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && showSender && (
                      <span className="text-[10px] font-bold text-slate-600 mb-1 ml-1 uppercase tracking-wider">
                        {msg.sender?.full_name || 'Opponent'}
                      </span>
                    )}
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1 font-medium">
                      {formatDate(msg.created_at, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
            <form onSubmit={sendMessage} className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message your opponent..."
                className="w-full pl-4 pr-14 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Score Submission Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {match.status === 'completed' ? 'Edit Match Score' : 'Submit Match Score'}
            </h3>
            
            <div className="space-y-6">
              {/* Set Scores */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <div className="flex-1"></div>
                  <div className="w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Home</div>
                  <div className="w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Away</div>
                </div>
                {[0, 1, 2].map((setIndex) => (
                  <div key={setIndex} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-900 w-12">Set {setIndex + 1}</span>
                    <select
                      value={setScores[setIndex]?.home || ''}
                      onChange={(e) => updateSetScore(setIndex, 'home', e.target.value)}
                      className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-</option>
                      {[...Array(8)].map((_, i) => (
                        <option key={i} value={String(i)}>{i}</option>
                      ))}
                    </select>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <select
                      value={setScores[setIndex]?.away || ''}
                      onChange={(e) => updateSetScore(setIndex, 'away', e.target.value)}
                      className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-</option>
                      {[...Array(8)].map((_, i) => (
                        <option key={i} value={String(i)}>{i}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Winner Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Winner</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWinnerId(match.home_player_id)}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                      winnerId === match.home_player_id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <div className="truncate">{match.home_player?.profile?.full_name?.split(' ')[0]}</div>
                    <div className="text-[10px] opacity-60">Home</div>
                  </button>
                  <button
                    onClick={() => setWinnerId(match.away_player_id)}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                      winnerId === match.away_player_id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <div className="truncate">{match.away_player?.profile?.full_name?.split(' ')[0]}</div>
                    <div className="text-[10px] opacity-60">Away</div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="flex-1 py-4 px-6 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreSubmit}
                  disabled={!winnerId || submittingScore}
                  className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100"
                >
                  {submittingScore ? 'Saving...' : 'Save Score'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
