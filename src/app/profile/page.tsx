'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'
import { getConfidenceDisplay, getConfidenceBadge } from '@/utils/rating'

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
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [ustaNumber, setUstaNumber] = useState('')
  const [playPrefs, setPlayPrefs] = useState({
    weekdays: false,
    weekends: false,
    mornings: false,
    afternoons: false,
    evenings: false,
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [gender, setGender] = useState('')
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, location, usta_number, play_preferences, gender, initial_ntrp_singles, initial_ntrp_doubles, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
        setLocation(profile.location || '')
        setUstaNumber(profile.usta_number || '')
        setPlayPrefs(profile.play_preferences || {
          weekdays: false,
          weekends: false,
          mornings: false,
          afternoons: false,
          evenings: false,
        })
        setGender(profile.gender || '')
        setInitialNtrpSingles(profile.initial_ntrp_singles?.toString() || '')
        setInitialNtrpDoubles(profile.initial_ntrp_doubles?.toString() || '')
        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url)
        }
      }

      try {
        const { data: playerResult } = await supabase
          .from('players')
          .select('*')
          .eq('profile_id', session.user.id)
          .maybeSingle()

        if (playerResult) {
          setPlayerData(playerResult)
          setIsPlayer(true)
          if (playerResult.initial_ntrp_singles) {
            setInitialNtrpSingles(playerResult.initial_ntrp_singles.toString())
          }
          if (playerResult.initial_ntrp_doubles) {
            setInitialNtrpDoubles(playerResult.initial_ntrp_doubles.toString())
          }
        } else {
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
      // Upload avatar if selected
      let avatarUrl = avatarPreview
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          avatarUrl = publicUrl
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          phone: phone || null,
          location: location || null,
          usta_number: ustaNumber || null,
          play_preferences: playPrefs,
          gender: gender || null,
          avatar_url: avatarUrl
        })
        .eq('id', session.user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      try {
        const { error: profileNtrpError } = await supabase
          .from('profiles')
          .update({
            initial_ntrp_singles: initialNtrpSingles ? parseFloat(initialNtrpSingles) : null,
            initial_ntrp_doubles: initialNtrpDoubles ? parseFloat(initialNtrpDoubles) : null,
          })
          .eq('id', session.user.id)

        if (profileNtrpError) {
          console.log('Profile NTRP update error:', profileNtrpError.message)
        }
      } catch (profileErr) {
        console.log('Profile update error:', profileErr)
      }

      try {
        if (playerData) {
          await supabase
            .from('players')
            .update({
              initial_ntrp_singles: initialNtrpSingles ? parseFloat(initialNtrpSingles) : null,
              initial_ntrp_doubles: initialNtrpDoubles ? parseFloat(initialNtrpDoubles) : null,
            })
            .eq('id', playerData.id)
        }
      } catch (playerErr) {
        // Silently ignore
      }

      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [supabase, fullName, phone, location, ustaNumber, playPrefs, initialNtrpSingles, initialNtrpDoubles, playerData, gender, avatarFile, avatarPreview])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const totalMatches = (playerData?.match_count_singles || 0) + (playerData?.match_count_doubles || 0)
  const totalWins = (playerData?.wins_singles || 0) + (playerData?.wins_doubles || 0)
  const totalLosses = (playerData?.losses_singles || 0) + (playerData?.losses_doubles || 0)
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl text-indigo-900 tracking-tight">Tennis-Flex</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Card with Avatar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-6">
           <div className="flex flex-col sm:flex-row items-center gap-6">
             <div className="relative">
               <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                 {avatarPreview ? (
                   <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-3xl font-bold text-white">{getInitials(fullName)}</span>
                 )}
               </div>
               <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md cursor-pointer hover:bg-slate-100">
                 <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 <input
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={(e) => {
                     const file = e.target.files?.[0]
                     if (file) {
                       setAvatarFile(file)
                       setAvatarPreview(URL.createObjectURL(file))
                     }
                   }}
                 />
               </label>
             </div>
             <div className="text-center sm:text-left">
               <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{fullName}</h1>
               <p className="text-slate-500 mt-1">{email}</p>
               {location && (
                 <p className="text-sm text-slate-500 mt-1">{location}</p>
               )}
               <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                 <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                   isPlayer ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                 }`}>
                   {isPlayer ? 'Player' : 'Member'}
                 </span>
                 {gender && (
                   <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 capitalize">
                     {gender}
                   </span>
                 )}
               </div>
             </div>
           </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* Stats Overview */}
        {isPlayer && playerData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{totalMatches}</p>
              <p className="text-sm text-slate-500 mt-1">Matches</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{totalWins}</p>
              <p className="text-sm text-slate-500 mt-1">Wins</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{totalLosses}</p>
              <p className="text-sm text-slate-500 mt-1">Losses</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{winRate}%</p>
              <p className="text-sm text-slate-500 mt-1">Win Rate</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ratings Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              My Ratings
            </h2>
            
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Singles</span>
                  {playerData?.tfr_singles && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {getConfidenceDisplay(playerData.tfr_singles, playerData.match_count_singles)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 rounded-lg p-3">
                    <p className="text-2xl font-bold text-indigo-600">{initialNtrpSingles || '--'}</p>
                    <p className="text-xs text-slate-500">Self-Rating</p>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-600">{playerData?.match_count_singles || 0}</p>
                    <p className="text-xs text-slate-500">Matches</p>
                  </div>
                </div>
                {playerData && (
                  <div className="flex gap-4 mt-2">
                    <div className="flex-1 text-center py-2 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-600">{playerData.wins_singles || 0}</p>
                      <p className="text-xs text-emerald-700">Wins</p>
                    </div>
                    <div className="flex-1 text-center py-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{playerData.losses_singles || 0}</p>
                      <p className="text-xs text-red-700">Losses</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Doubles</span>
                  {playerData?.tfr_doubles && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {getConfidenceDisplay(playerData.tfr_doubles, playerData.match_count_doubles)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 rounded-lg p-3">
                    <p className="text-2xl font-bold text-indigo-600">{initialNtrpDoubles || '--'}</p>
                    <p className="text-xs text-slate-500">Self-Rating</p>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-600">{playerData?.match_count_doubles || 0}</p>
                    <p className="text-xs text-slate-500">Matches</p>
                  </div>
                </div>
                {playerData && (
                  <div className="flex gap-4 mt-2">
                    <div className="flex-1 text-center py-2 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-600">{playerData.wins_doubles || 0}</p>
                      <p className="text-xs text-emerald-700">Wins</p>
                    </div>
                    <div className="flex-1 text-center py-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{playerData.losses_doubles || 0}</p>
                      <p className="text-xs text-red-700">Losses</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                    Location / Home Court
                  </label>
                  <input
                    id="location"
                    type="text"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State or Court Name"
                  />
                </div>

                <div>
                  <label htmlFor="usta" className="block text-sm font-medium text-slate-700 mb-1">
                    USTA Number
                  </label>
                  <input
                    id="usta"
                    type="text"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={ustaNumber}
                    onChange={(e) => setUstaNumber(e.target.value)}
                    placeholder="e.g., 123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Play Preferences
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['weekdays', 'Weekdays'],
                      ['weekends', 'Weekends'],
                      ['mornings', 'Mornings'],
                      ['afternoons', 'Afternoons'],
                      ['evenings', 'Evenings'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={playPrefs[key as keyof typeof playPrefs]}
                          onChange={(e) => setPlayPrefs({ ...playPrefs, [key]: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    disabled
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-500 bg-slate-50"
                    value={email}
                  />
                  <p className="text-xs text-slate-400 mt-1">Contact support to change your email</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Self-Rating</h2>
              <p className="text-sm text-slate-500 mb-4">
                Rate yourself honestly to be placed in the right division. Find your level at{' '}
                <a href="https://www.usta.com/ntrp" target="_blank" rel="noopener" className="text-indigo-600 underline hover:text-indigo-700">
                  usta.com/ntrp
                </a>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ntrpSingles" className="block text-sm font-medium text-slate-700 mb-1">
                    Singles
                  </label>
                  <select
                    id="ntrpSingles"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={initialNtrpSingles}
                    onChange={(e) => setInitialNtrpSingles(e.target.value)}
                  >
                    <option value="">Not set</option>
                    <option value="1.0">1.0</option>
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
                    <option value="7.0">7.0</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="ntrpDoubles" className="block text-sm font-medium text-slate-700 mb-1">
                    Doubles
                  </label>
                  <select
                    id="ntrpDoubles"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={initialNtrpDoubles}
                    onChange={(e) => setInitialNtrpDoubles(e.target.value)}
                  >
                    <option value="">Not set</option>
                    <option value="1.0">1.0</option>
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
                    <option value="7.0">7.0</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}