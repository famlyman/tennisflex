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
  const [requests, setRequests] = useState<ChapterRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      setRequests(data.pending)
    } catch (err) {
      setError('Failed to load requests')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateFlex(request: ChapterRequest) {
    setCreatingId(request.id)
    setError(null)
    setSuccess(null)
    
    try {
      const formData = new FormData()
      formData.append('request_id', request.id)
      formData.append('chapter_name', request.chapter_name)
      formData.append('region', request.region)
      formData.append('email', request.email)
      formData.append('full_name', request.full_name)
      
      const response = await fetch('/api/admin/chapters/create-flex', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Flex')
      }
      
      setSuccess(`Flex "${request.chapter_name}" created! Email sent to ${request.email}`)
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to create Flex')
      console.error(err)
    } finally {
      setCreatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
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
          <h1 className="text-3xl font-bold text-slate-900">Create a Flex</h1>
          <p className="text-slate-600 mt-1">
            Create a new Flex and automatically send an invitation to the coordinator.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No pending Flex requests.</p>
            <p className="text-sm text-slate-400 mt-1">
              Requests will appear here when someone submits "Request Your Flex".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
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
                  
                  <button
                    onClick={() => handleCreateFlex(request)}
                    disabled={creatingId !== null}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {creatingId === request.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Flex & Send Invite
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
