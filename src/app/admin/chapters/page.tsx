'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ChapterRequest {
  id: string
  chapter_name: string
  region: string
  reason: string
  full_name: string
  email: string
  status: string
  created_at: string
}

export default function AdminChapters() {
  const [pendingRequests, setPendingRequests] = useState<ChapterRequest[]>([])
  const [processedRequests, setProcessedRequests] = useState<ChapterRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const response = await fetch('/api/admin/chapters/data', {
        cache: 'no-store'
      })
      if (response.redirected || response.url.includes('/login')) {
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        throw new Error('Failed to load requests')
      }
      const data = await response.json()
      setPendingRequests(data.pending)
      setProcessedRequests(data.processed)
    } catch (err) {
      setError('Failed to load requests')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(requestId: string, flexName: string, region: string) {
    setActionLoading(requestId)
    try {
      const formData = new FormData()
      formData.append('chapter_name', flexName)
      formData.append('region', region)
      
      const response = await fetch(`/api/admin/chapters/${requestId}/approve`, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok || response.redirected) {
        window.location.href = '/admin/chapters'
      } else {
        throw new Error('Failed to approve')
      }
    } catch (err) {
      console.error('Approve error:', err)
      setActionLoading(null)
    }
  }

  async function handleDeny(requestId: string) {
    setActionLoading(requestId)
    try {
      const formData = new FormData()
      
      const response = await fetch(`/api/admin/chapters/${requestId}/deny`, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok || response.redirected) {
        window.location.href = '/admin/chapters'
      } else {
        throw new Error('Failed to deny')
      }
    } catch (err) {
      console.error('Deny error:', err)
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
              Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Flex Requests</h1>
          <p className="text-slate-600 mt-1">
            Review and approve requests to start new Tennis-Flex Flexes.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-sm px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No pending Flex requests.</p>
              <p className="text-sm text-slate-400 mt-1">
                Requests will appear here when someone submits "Request Your Flex".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">
                          {request.chapter_name}
                        </h3>
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">
                        {request.region}
                      </p>
                      <div className="text-sm text-slate-600 mb-4">
                        <p className="font-medium mb-1">Reason:</p>
                        <p className="text-slate-500">{request.reason}</p>
                      </div>
                      <div className="text-sm text-slate-500">
                        <span>Requested by: {request.full_name}</span>
                        <span className="mx-2">•</span>
                        <span>{request.email}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
                      <button
                        onClick={() => handleApprove(request.id, request.chapter_name, request.region)}
                        disabled={actionLoading !== null}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading !== null ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleDeny(request.id)}
                        disabled={actionLoading !== null}
                        className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {processedRequests.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Processed Requests</h2>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div 
                  key={request.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{request.chapter_name}</h3>
                      <p className="text-sm text-slate-500">{request.region}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      request.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
