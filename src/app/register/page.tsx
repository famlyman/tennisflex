'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

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
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Organization request fields
  const [orgName, setOrgName] = useState('')
  const [region, setRegion] = useState('')
  const [reason, setReason] = useState('')
  
  const router = useRouter()

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()

    // If "Request an Organization" mode - just submit request, no account yet
    if (initialType === 'request') {
      // Just submit organization request (account created after approval)
      const { error: requestError } = await supabase.from('chapter_requests').insert({
        email,
        full_name: fullName,
        chapter_name: orgName,
        region,
        reason,
      })

      if (requestError) {
        console.error('Request error:', requestError)
        setError(requestError.message)
      } else {
        setMessage('Organization request submitted! Once approved, you will receive an email to set up your account and manage your organization.')
        setShowSuccessModal(true)
      }
      setLoading(false)
      return
    }

    // Normal registration (player or coordinator without org request)
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
  }, [fullName, userType, initialType, orgName, region, reason])

  const handleCloseModal = useCallback(() => {
    setShowSuccessModal(false)
    router.push('/')
  }, [router])

  const isOrganizationRequest = initialType === 'request'

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
          <div>
            <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl leading-none">T</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
              {isOrganizationRequest ? 'Request an Organization' : 'Create your account'}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              {!isOrganizationRequest && (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors underline decoration-indigo-200 underline-offset-4">
                    Sign in
                  </Link>
                </>
              )}
              {isOrganizationRequest && (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Sign in
                  </Link>
                </>
              )}
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
            
            {!isOrganizationRequest && (
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

            {isOrganizationRequest && (
              <div className="space-y-4 rounded-lg bg-amber-50 p-4 -mt-4 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Submit your organization request. You'll receive an email to create your account once it's approved.
                </p>
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

              {!isOrganizationRequest && (
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

              {isOrganizationRequest && (
                <>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">Organization Details</p>
                  </div>

                  <div>
                    <label htmlFor="org-name" className="block text-sm font-medium text-slate-700 mb-1">
                      Proposed Organization Name
                    </label>
                    <input
                      id="org-name"
                      name="orgName"
                      type="text"
                      required
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Tennis-Flex Foothills"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
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
                      Why do you want to start an organization?
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
                {loading ? 'Submitting...' : (isOrganizationRequest ? 'Submit Request' : 'Create Account')}
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
                {isOrganizationRequest ? 'Request Submitted!' : 'Check Your Email'}
              </h3>
              <p className="text-slate-600 mb-6">
                {isOrganizationRequest 
                  ? 'Your organization request has been submitted. You will receive an email to create your account once it is approved.'
                  : 'Registration successful! Please check your email for a confirmation link.'}
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}