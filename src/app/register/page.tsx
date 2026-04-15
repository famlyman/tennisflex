'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') || 'player'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState(initialType === 'request' ? 'coordinator' : initialType)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Chapter request fields
  const [chapterName, setChapterName] = useState('')
  const [region, setRegion] = useState('')
  const [reason, setReason] = useState('')
  
  const router = useRouter()

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )

    // If "Request a Chapter" mode, submit chapter request
    if (initialType === 'request') {
      const { error: requestError } = await supabase.from('chapter_requests').insert({
        email,
        full_name: fullName,
        chapter_name: chapterName,
        region,
        reason,
      })

      if (requestError) {
        setError(requestError.message)
      } else {
        setMessage('Chapter request submitted! We will review your request and be in touch.')
        setUserType('coordinator') // Reset UI
      }
      setLoading(false)
      return
    }

    // Normal registration
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setMessage('Registration successful! Please check your email for a confirmation link.')
    }
    setLoading(false)
  }, [fullName, userType, initialType, chapterName, region, reason])

  const isChapterRequest = initialType === 'request'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
        <div>
          <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl leading-none">T</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            {isChapterRequest ? 'Request a Chapter' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            {!isChapterRequest && (
              <>
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors underline decoration-indigo-200 underline-offset-4">
                  Sign in
                </Link>
              </>
            )}
            {isChapterRequest && (
              <Link href="/register?type=player" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Register as player instead
              </Link>
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {message && (
            <div className="rounded-md bg-emerald-50 p-4">
              <div className="text-sm text-emerald-700">{message}</div>
            </div>
          )}
          
          {!isChapterRequest && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('player')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      userType === 'player'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('coordinator')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      userType === 'coordinator'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Coordinator
                  </button>
                </div>
              </div>
            </div>
          )}

          {isChapterRequest && (
            <div className="space-y-4 rounded-lg bg-slate-50 p-4 -mt-4">
              <p className="text-sm text-slate-600">
                Want to bring Tennis-Flex to your area? Submit a request to start a new chapter.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-slate-700 mb-1">
                {isChapterRequest ? 'Your Name' : 'Full Name'}
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!isChapterRequest && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {isChapterRequest && (
              <>
                <div>
                  <label htmlFor="chapter-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Proposed Chapter Name
                  </label>
                  <input
                    id="chapter-name"
                    name="chapterName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="Tennis-Flex Foothills"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
                    Region / Area
                  </label>
                  <input
                    id="region"
                    name="region"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="Seattle metro area"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">
                    Why do you want to start a chapter?
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    rows={3}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    placeholder="Tell us about your tennis community..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {loading ? 'Submitting...' : (isChapterRequest ? 'Submit Request' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}