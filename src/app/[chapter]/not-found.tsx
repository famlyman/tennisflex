import Link from 'next/link'

export default function ChapterNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Flex Not Found</h1>
          <p className="text-gray-600">
            This Flex doesn't exist or hasn't launched yet.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse All Flexes
        </Link>
      </div>
    </div>
  )
}
