'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

interface PlayerData {
  id: string
  initial_ntrp_singles: number | null
  initial_ntrp_doubles: number | null
  tfr_singles: number | null
  tfr_doubles: number | null
  match_count_singles: number
  match_count_doubles: number
  wins_singles: number
  losses_singles: number
  wins_doubles: number
  losses_doubles: number
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPlayer, setIsPlayer] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [initialNtrpSingles, setInitialNtrpSingles] = useState('')
  const [initialNtrpDoubles, setInitialNtrpDoubles] = useState('')
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setEmail(session.user.email || '')

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
      }

      // Get player data
      try {
        const { data: playerResult } = await supabase
          .from('players')
          .select('*')
          .eq('profile_id', session.user.id)
          .maybeSingle()

        if (playerResult) {
          setPlayerData(playerResult)
          setIsPlayer(true)
          setInitialNtrpSingles(playerResult.initial_ntrp_singles?.toString() || '')
          setInitialNtrpDoubles(playerResult.initial_ntrp_doubles?.toString() || '')
        } else {
          // Check if coordinator
          const { data: coords } = await supabase
            .from('coordinators')
            .select('organization_id')
            .eq('profile_id', session.user.id)
            
          setIsPlayer(!!(coords && coords.length > 0))
        }
      } catch (err) {
        console.log('Player data fetch error:', err)
        setIsPlayer(false)
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

    try {
      // Step 1: Always update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', session.user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Step 2: Try to create or update player record
      try {
        if (playerData) {
          // Update existing
          const { error: playerError } = await supabase
            .from('players')
            .update({
              initial_ntrp_singles: initialNtrpSingles ? parseFloat(initialNtrpSingles) : null,
              initial_ntrp_doubles: initialNtrpDoubles ? parseFloat(initialNtrpDoubles) : null,
            })
            .eq('id', playerData.id)

          if (playerError) {
            console.log('Player update error:', playerError.message)
          }
        } else if (initialNtrpSingles || initialNtrpDoubles) {
          // Check if user is a coordinator - get their organization
          const { data: coords } = await supabase
            .from('coordinators')
            .select('organization_id')
            .eq('profile_id', session.user.id)
            .maybeSingle()

          const orgId = coords?.organization_id

          if (orgId) {
            // Create player with coordinator's org
            const { error: insertError } = await supabase
              .from('players')
              .insert({
                profile_id: session.user.id,
                organization_id: orgId,
                initial_ntrp_singles: initialNtrpSingles ? parseFloat(initialNtrpSingles) : null,
                initial_ntrp_doubles: initialNtrpDoubles ? parseFloat(initialNtrpDoubles) : null,
              })

            if (!insertError) {
              setIsPlayer(true)
            } else if (insertError.message.includes('row-level security')) {
              // RLS issue - silently skip, profile still saved
            } else {
              console.log('Player insert error:', insertError.message)
            }
          }
        }
      } catch (playerErr) {
        // Silently ignore player errors - profile should still save
        console.log('Player operation error:', playerErr)
      }

      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [supabase, fullName, initialNtrpSingles, initialNtrpDoubles, playerData])

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

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-1">Manage your account and ratings</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-md bg-emerald-50 p-4">
            <div className="text-sm text-emerald-700">{success}</div>
          </div>
        )}

        {/* Profile Stats Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Ratings</h2>
          
          {!isPlayer && !playerData ? (
            <div className="bg-amber-50 rounded-xl p-4 text-amber-800">
              <p>Join a season or become a coordinator to track your ratings.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Singles Rating</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {playerData?.tfr_singles?.toFixed(1) || initialNtrpSingles || '--'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {playerData?.match_count_singles || 0} matches played
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">Doubles Rating</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {playerData?.tfr_doubles?.toFixed(1) || initialNtrpDoubles || '--'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {playerData?.match_count_doubles || 0} matches played
                  </p>
                </div>
              </div>

              {playerData && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-emerald-600">{playerData.wins_singles || 0}</p>
                      <p className="text-xs text-slate-500">Singles Wins</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600">{playerData.losses_singles || 0}</p>
                      <p className="text-xs text-slate-500">Singles Losses</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-emerald-600">{playerData.wins_doubles || 0}</p>
                      <p className="text-xs text-slate-500">Doubles Wins</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-600">{playerData.losses_doubles || 0}</p>
                      <p className="text-xs text-slate-500">Doubles Losses</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-500 bg-slate-50"
                  value={email}
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Self-Rating (NTRP)</h2>
            <p className="text-sm text-slate-500 mb-4">
              Rate yourself honestly to be placed in the right division. Find your level at <a href="https://www.usta.com/ntrp" target="_blank" rel="noopener" className="text-indigo-600 underline">usta.com/ntrp</a>
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ntrpSingles" className="block text-sm font-medium text-slate-700 mb-1">
                  NTRP Singles
                </label>
                <select
                  id="ntrpSingles"
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  value={initialNtrpSingles}
                  onChange={(e) => setInitialNtrpSingles(e.target.value)}
                >
                  <option value="">Not set</option>
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
                  NTRP Doubles
                </label>
                <select
                  id="ntrpDoubles"
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  value={initialNtrpDoubles}
                  onChange={(e) => setInitialNtrpDoubles(e.target.value)}
                >
                  <option value="">Not set</option>
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