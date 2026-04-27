'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CoordinatorActionButtonProps {
  action: string
  seasonId: string
  children: React.ReactNode
  className?: string
  variant?: 'green' | 'blue' | 'amber' | 'purple' | 'red'
  successMessage?: string
}

const variantClasses = {
  green: 'bg-emerald-600 hover:bg-emerald-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  red: 'bg-red-600 hover:bg-red-700',
}

export default function CoordinatorActionButton({
  action,
  seasonId,
  children,
  className = '',
  variant = 'blue',
  successMessage,
}: CoordinatorActionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    
    try {
      const res = await fetch(`/api/seasons/${seasonId}/${action}`, {
        method: 'POST',
      })
      
      if (res.ok) {
        const data = await res.json()
        
        if (data.success && successMessage) {
          let message = successMessage
          if (data.matchesCreated !== undefined) {
            message = `${successMessage}: ${data.matchesCreated} matches created`
          }
          alert(message)
        }
        
        if (data.redirectUrl) {
          router.push(data.redirectUrl)
        } else {
          router.refresh()
        }
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || 'Something went wrong'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3 py-1 text-sm text-white rounded-lg ${variantClasses[variant]} ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}