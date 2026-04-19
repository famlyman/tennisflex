'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [initialNtrpSingles, setInitialNtrpSingles] = useState('')
  const [initialNtrpDoubles, setInitialNtrpDoubles] = useState('')
  
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
      }

      // Get player ratings if exists
      const { data: player } = await supabase
        .from('players')
        .select('initial_ntrp_singles, initial_ntrp_doubles')
        .eq('profile_id', session.user.id)
        .single()

      if (player) {
        setInitialNtrpSingles(player.initial_ntrp_singles?.toString() || '')
        setInitialNtrpDoubles(player.initial_ntrp_doubles?.toString() || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Update profile name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', session.user.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    // Check if player record exists, create or update
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('profile_id', session.user.id)
      .single()

    if (existingPlayer) {
      await supabase
        .from('players')
        .update({
          initial_ntrp_singles: initialNtrpSingles ? parseFloat(initialNtrpSingles) : null,
          initial_ntrp_doubles: initialNtrpDoubles ? parseFloat(initialNtrpDoubles) : null,
        })
        .eq('profile_id', session.user.id)
    } else {
      // Get user's organizations
      const { data: coordinatorOrgs } = await supabase
        .from('coordinators')
        .select('organization_id')
        .eq('profile_id', session.user.id)

      const orgIds = coordinatorOrgs?.map((c: { organization_id: string }) => c.organization_id) || []
      
      if (orgIds.length > 0) {
        await supabase.from('players').insert({
          profile_id: session.user.id,
          organization_id: orgIds[0],
          initial_ntrp_singles: initialNtrpSingles ? parseFloat(initialNtrpSingles) : null,
          initial_ntrp_doubles: initialNtrpDoubles ? parseFloat(initialNtrpDoubles) : null,
        })
      }
    }

    setSuccess('Profile updated successfully!')
    setSaving(false)
  }, [supabase, fullName, initialNtrpSingles, initialNtrpDoubles])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
          <p className="text-slate-600 mt-1">Update your information and self-rating</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">{success}</div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Info</h2>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Self-Rating (NTRP)</h2>
            <p className="text-sm text-slate-500 mb-4">
              Rate yourself honestly based on the NTRP scale (1.0-7.0). This helps place you in the right division.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ntrpSingles" className="block text-sm font-medium text-slate-700 mb-1">
                  NTRP Singles (1.0-7.0)
                </label>
                <select
                  id="ntrpSingles"
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  value={initialNtrpSingles}
                  onChange={(e) => setInitialNtrpSingles(e.target.value)}
                >
                  <option value="">Select rating</option>
                  <option value="1.0">1.0 - Beginner</option>
                  <option value="1.5">1.5</option>
                  <option value="2.0">2.0</option>
                  <option value="2.5">2.5</option>
                  <option value="3.0">3.0</option>
                  <option value="3.5">3.5</option>
                  <option value="4.0">4.0</option>
                  <option value="4.5">4.5</option>
                  <option value="5.0">5.0</option>
                  <option value="5.5">5.5</option>
                  <option value="6.0">6.0</option>
                  <option value="6.5">6.5</option>
                  <option value="7.0">7.0 - Expert</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="ntrpDoubles" className="block text-sm font-medium text-slate-700 mb-1">
                  NTRP Doubles (1.0-7.0)
                </label>
                <select
                  id="ntrpDoubles"
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  value={initialNtrpDoubles}
                  onChange={(e) => setInitialNtrpDoubles(e.target.value)}
                >
                  <option value="">Select rating</option>
                  <option value="1.0">1.0 - Beginner</option>
                  <option value="1.5">1.5</option>
                  <option value="2.0">2.0</option>
                  <option value="2.5">2.5</option>
                  <option value="3.0">3.0</option>
                  <option value="3.5">3.5</option>
                  <option value="4.0">4.0</option>
                  <option value="4.5">4.5</option>
                  <option value="5.0">5.0</option>
                  <option value="5.5">5.5</option>
                  <option value="6.0">6.0</option>
                  <option value="6.5">6.5</option>
                  <option value="7.0">7.0 - Expert</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  )
}