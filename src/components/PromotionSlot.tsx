'use client'

import { useState, useEffect } from 'react'
import PromoCard from './PromoCard'

interface Promotion {
  id: string
  type: 'direct' | 'affiliate' | 'placeholder'
  title: string
  description: string | null
  link_url: string | null
  call_to_action: string | null
  display_locations: string[]
  priority: number
}

const typeIcons: Record<string, string> = {
  affiliate: '🎾',
  direct: '🏢',
  placeholder: '🤝',
}

interface PromotionSlotProps {
  location: string
  compact?: boolean
  limit?: number
  fallback?: React.ReactNode
}

export default function PromotionSlot({ location, compact = false, limit = 3, fallback }: PromotionSlotProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/promotions?location=${location}`)
      .then(res => res.json())
      .then((data: Promotion[]) => {
        setPromotions(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [location])

  if (loading) {
    return compact
      ? <div className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
      : <div className="h-52 bg-slate-50 rounded-3xl animate-pulse" />
  }

  const visible = promotions.slice(0, limit)

  if (visible.length === 0) {
    return fallback ?? null
  }

  return (
    <>
      {visible.map(promo => (
        <PromoCard
          key={promo.id}
          type={promo.type}
          compact={compact}
          title={promo.title}
          description={promo.description || ''}
          link={promo.link_url || '#'}
          cta={promo.call_to_action || 'Learn More'}
          icon={typeIcons[promo.type] || '🎾'}
        />
      ))}
    </>
  )
}
