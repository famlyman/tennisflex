'use client'

import { useState } from 'react'

interface Division {
  id: string
  type: string
  category: string
  rating: number
  skillLevelName: string | null
}

interface Props {
  divisions: Division[]
  children: React.ReactNode
}

export function RegistrationFormClient({ divisions, children }: Props) {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    const checked = form.querySelectorAll('input[name="division_ids"]:checked')
    
    if (checked.length === 0) {
      e.preventDefault()
      setError('Please select at least one division to register for.')
    }
  }

  return (
    <form action={`/api/seasons/${divisions[0]?.id || ''}/register`} method="POST" onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {children}
    </form>
  )
}