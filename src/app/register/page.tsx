'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const isRequest = type === 'request'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  
  // Chapter request fields
  const [chapterName, setChapterName] = useState('')
  const [region, setRegion] = useState('')
  const [reason, setReason] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isRequest) {
      try {
        const res = await fetch('/api/chapters/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            full_name: fullName,
            chapter_name: chapterName,
            region,
            reason
          })
        })

        if (res.ok) {
          setMessage('Request submitted successfully! Our team will review your application and get back to you soon.')
          setShowSuccessModal(true)
        } else {
          const err = await res.json()
          setError(err.error || 'Failed to submit request')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      }
    } else {
      const supabase = getSupabaseClient()

      // Normal registration as player
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: 'player',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setMessage('Registration successful! Please check your email for a confirmation link.')
        setShowSuccessModal(true)
      }
    }
    setLoading(false)
  }, [isRequest, fullName, email, password, chapterName, region, reason])

  const handleCloseModal = useCallback(() => {
    setShowSuccessModal(false)
    router.push('/')
  }, [router])

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
          <div>
            <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl leading-none">T</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
              {isRequest ? 'Request a New Flex' : 'Create your account'}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              {isRequest 
                ? 'Tell us where you want to launch a local league.' 
                : <>Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors underline decoration-indigo-200 underline-offset-4">Sign in</Link></>
              }
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            {message && !showSuccessModal && (
              <div className="rounded-md bg-emerald-50 p-4">
                <div className="text-sm text-emerald-700">{message}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
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

              {isRequest ? (
                <>
                  <div>
                    <label htmlFor="chapter-name" className="block text-sm font-medium text-slate-700 mb-1">
                      Proposed Flex Name
                    </label>
                    <input
                      id="chapter-name"
                      name="chapter-name"
                      type="text"
                      required
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g. Westside Tennis Flex"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
                      City / Region
                    </label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      required
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g. Atlanta, GA"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">
                      Why do you want to coordinate?
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Tell us about the tennis community in your area..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </>
              ) : (
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
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg shadow-indigo-100"
              >
                {loading 
                  ? (isRequest ? 'Submitting Request...' : 'Creating Account...') 
                  : (isRequest ? 'Submit Request' : 'Create Account')
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {isRequest ? 'Request Received' : 'Check Your Email'}
              </h3>
              <p className="text-slate-600 mb-6">
                {isRequest 
                  ? 'Thank you! Your request has been submitted. Our team will review it and contact you via email soon.'
                  : 'Registration successful! Please check your email for a confirmation link.'
                }
              </p>
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}