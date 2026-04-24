'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PUT',
      body: JSON.stringify({ markAllRead: true })
    })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (loading) {
    return (
      <button className="p-2 text-slate-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
    )
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-600 hover:text-indigo-600 relative"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-slate-500 text-sm">
                No notifications yet
              </p>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || '#'}
                  className={`block p-3 hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                  {notif.message && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}