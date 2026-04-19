'use client'

import { getSupabaseClient } from '@/utils/client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CreateSeasonPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrgs() {
      const supabase = getSupabaseClient()

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: coordinatorOrgs } = await supabase
        .from('coordinators')
        .select('organization_id')
        .eq('profile_id', session.user.id)

      if (!coordinatorOrgs || coordinatorOrgs.length === 0) {
        setLoading(false)
        return
      }

      const orgIds = coordinatorOrgs.map((c: { organization_id: string }) => c.organization_id)
      const { data: orgs } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)

      setOrganizations(orgs || [])
      setLoading(false)
    }

    fetchOrgs()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create season')
        setSubmitting(false)
        return
      }

      if (data.success) {
        // Use window.location for client-side redirect
        window.location.href = '/seasons'
        return
      }

      setError('Unexpected response')
      setSubmitting(false)
    } catch (err) {
      console.error('Submit error:', err)
      setError('An error occurred')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  if (organizations.length === 0) {
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
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
              Dashboard
            </Link>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">No Organizations Found</h1>
            <p className="text-slate-600 mb-6">
              You need to be a coordinator of an organization to create seasons.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
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
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create New Season</h1>
          <p className="text-slate-600 mt-1">Set up a new tennis season for your organization.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="action" value="create" />
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <div>
            <label htmlFor="organization_id" className="block text-sm font-medium text-slate-700 mb-2">
              Organization
            </label>
            <select
              id="organization_id"
              name="organization_id"
              required
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Season Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Spring 2026"
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="registration_start" className="block text-sm font-medium text-slate-700 mb-2">
                Registration Start
              </label>
              <input
                type="date"
                id="registration_start"
                name="registration_start"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="registration_end" className="block text-sm font-medium text-slate-700 mb-2">
                Registration End
              </label>
              <input
                type="date"
                id="registration_end"
                name="registration_end"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="season_start" className="block text-sm font-medium text-slate-700 mb-2">
                Season Start
              </label>
              <input
                type="date"
                id="season_start"
                name="season_start"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="season_end" className="block text-sm font-medium text-slate-700 mb-2">
                Season End
              </label>
              <input
                type="date"
                id="season_end"
                name="season_end"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Season'}
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}