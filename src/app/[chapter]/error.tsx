'use client'

import Link from 'next/link'

export default function ChapterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-semibold text-red-600">Error Loading Flex</h2>
        <p className="text-gray-600">
          {error.message || 'Failed to load this Flex'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
