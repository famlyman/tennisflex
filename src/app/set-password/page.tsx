'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifySetPasswordToken, SetPasswordTokenPayload } from '@/utils/token'

function SetPasswordInner() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [tokenPayload, setTokenPayload] = useState<SetPasswordTokenPayload | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid link: No token provided')
        setValidating(false)
        return
      }

      try {
        const payload = await verifySetPasswordToken(token)
        if (!payload) {
          setError('Invalid or expired token. Please request a new invitation.')
          setValidating(false)
          return
        }
        setTokenPayload(payload)
        setError(null)
      } catch {
        setError('Failed to verify token. Please try the link from your email again.')
      }
      setValidating(false)
    }

    verifyToken()
  }, [token])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !tokenPayload) {
      setError('Invalid request')
      return
    }

    setSubmitting(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to set password')
      } else {
        setMessage('Password set successfully! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError('Failed to set password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [router, token, tokenPayload, password, confirmPassword])

  const isLoading = validating || submitting
  const canSubmit = !isLoading && tokenPayload && !message

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
          <div className="text-center">
            <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl leading-none">T</span>
            </div>
            <p className="text-slate-600">Verifying link...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
        <div>
          <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl leading-none">T</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Set Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Create a password for your new Tennis-Flex account.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={!canSubmit}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                disabled={!canSubmit}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Setting password...' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Wrap with Suspense for useSearchParams
import { Suspense } from 'react'

export default function SetPassword() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
          <div className="text-center">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SetPasswordInner />
    </Suspense>
  )
}