'use client'

import { useState, useEffect } from 'react'

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
  
  // Manual creation state
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualFlexName, setManualFlexName] = useState('')
  const [manualRegion, setManualRegion] = useState('')
  const [manualCoordName, setManualCoordName] = useState('')
  const [manualEmail, setManualEmail] = useState('')

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

  async function handleCreateFlex(data: { id?: string, chapter_name: string, region: string, email: string, full_name: string }) {
    setCreatingId(data.id || 'manual')
    setError(null)
    setSuccess(null)
    
    try {
      const formData = new FormData()
      if (data.id) formData.append('request_id', data.id)
      formData.append('chapter_name', data.chapter_name)
      formData.append('region', data.region)
      formData.append('email', data.email)
      formData.append('full_name', data.full_name)
      
      const response = await fetch('/api/admin/chapters/create-flex', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create Flex')
      }
      
      setSuccess(`Flex "${data.chapter_name}" created! Email sent to ${data.email}`)
      
      // Reset manual form if used
      if (!data.id) {
        setManualFlexName('')
        setManualRegion('')
        setManualCoordName('')
        setManualEmail('')
        setShowManualForm(false)
      }

      loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create Flex')
      console.error(err)
    } finally {
      setCreatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Pipeline...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">
              <span>🚀</span> Expansion Pipeline
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Expansion Management</h1>
            <p className="text-slate-500 font-medium">Review community requests and provision new Flex chapters.</p>
          </div>
          <button 
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
          >
            {showManualForm ? 'Cancel Manual Create' : '+ Create Flex Manually'}
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 font-medium animate-in fade-in duration-500">
            {success}
          </div>
        )}

        {/* Manual Creation Form */}
        {showManualForm && (
          <div className="bg-white rounded-3xl border-2 border-indigo-500/20 p-8 mb-12 shadow-xl shadow-indigo-500/5 animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">🏗️</span>
              Manual Flex Creation
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Flex Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Buckhead Flex" 
                  value={manualFlexName}
                  onChange={(e) => setManualFlexName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">City / Region</label>
                <input 
                  type="text" 
                  placeholder="e.g. Atlanta, GA" 
                  value={manualRegion}
                  onChange={(e) => setManualRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Coordinator Name</label>
                <input 
                  type="text" 
                  placeholder="John Smith" 
                  value={manualCoordName}
                  onChange={(e) => setManualCoordName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Coordinator Email</label>
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={!manualFlexName || !manualEmail || creatingId !== null}
                onClick={() => handleCreateFlex({ 
                  chapter_name: manualFlexName, 
                  region: manualRegion, 
                  email: manualEmail, 
                  full_name: manualCoordName 
                })}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
              >
                {creatingId === 'manual' ? 'Building Flex...' : 'Create Flex & Send Welcome Email'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>📥</span> Community Requests
            <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-lg font-bold">{requests.length} Pending</span>
          </h2>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              📭
            </div>
            <p className="font-bold text-slate-900">No pending requests</p>
            <p className="text-sm text-slate-400 mt-1">
              New city applications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id}
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:border-indigo-200 transition-colors group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider">
                        Pending
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-black text-2xl text-slate-900 mb-1">
                      {request.chapter_name}
                    </h3>
                    <p className="text-indigo-600 font-bold text-sm mb-6 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {request.region}
                    </p>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expansion Reason</p>
                      <p className="text-slate-700 text-sm leading-relaxed italic">&quot;{request.reason}&quot;</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-black text-slate-400">
                        {request.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{request.full_name}</p>
                        <p className="text-xs text-slate-500 font-medium">{request.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:w-64 pt-6 lg:pt-0">
                    <button
                      onClick={() => handleCreateFlex({
                        id: request.id,
                        chapter_name: request.chapter_name,
                        region: request.region,
                        email: request.email,
                        full_name: request.full_name
                      })}
                      disabled={creatingId !== null}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      {creatingId === request.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Approve & Provision'
                      )}
                    </button>
                    <button className="w-full mt-2 py-3 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">
                      Dismiss Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
