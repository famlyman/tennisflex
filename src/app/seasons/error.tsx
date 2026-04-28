'use client'

import Link from 'next/link'

export default function SeasonsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-semibold text-red-600">Error Loading Seasons</h2>
        <p className="text-gray-600">
          {error.message || 'Failed to load seasons'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
