import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-gray-400">404</h1>
          <h2 className="text-2xl font-semibold">Page not found</h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
