'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    full_name: string
  }
}

interface MatchChatProps {
  matchId: string
  opponentName: string
  currentUserId: string
}

export default function MatchChat({ matchId, opponentName, currentUserId }: MatchChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [matchId])

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages?match_id=${matchId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    try {
      const res = await fetch(`/api/messages?match_id=${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })
      
      if (res.ok) {
        setNewMessage('')
        loadMessages()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Chat with {opponentName}</h3>
        <p className="text-xs text-slate-500">Coordinate your match</p>
      </div>
      
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center text-slate-500 text-sm">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-3 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}