import Link from 'next/link'

export default function SeasonNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Season Not Found</h1>
          <p className="text-gray-600">
            This season doesn't exist or has been removed.
          </p>
        </div>
        <Link
          href="/seasons"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View All Seasons
        </Link>
      </div>
    </div>
  )
}
