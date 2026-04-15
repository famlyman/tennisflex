'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/utils/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = getSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/set-password`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setMessage('Check your email for a password reset link.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }, [email])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200">
        <div>
          <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl leading-none">T</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleReset}>
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

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link 
              href="/login" 
              className="text-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
