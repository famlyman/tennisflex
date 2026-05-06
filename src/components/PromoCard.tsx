'use client'

import Link from 'next/link'

interface PromoCardProps {
  type: 'direct' | 'affiliate' | 'placeholder'
  title: string
  description: string
  cta?: string
  link: string
  icon?: string
  compact?: boolean
}

export default function PromoCard({ 
  type, 
  title, 
  description, 
  cta = 'Learn More', 
  link, 
  icon = '🎾',
  compact = false
}: PromoCardProps) {
  
  const bgStyles = {
    direct: 'bg-indigo-50 border-indigo-100',
    affiliate: 'bg-emerald-50 border-emerald-100',
    placeholder: 'bg-slate-50 border-slate-200 border-dashed'
  }

  const iconBg = {
    direct: 'bg-indigo-600',
    affiliate: 'bg-emerald-600',
    placeholder: 'bg-slate-400'
  }

  const titleColor = {
    direct: 'text-indigo-900',
    affiliate: 'text-emerald-900',
    placeholder: 'text-slate-900'
  }

  const label = {
    direct: 'Sponsor',
    affiliate: 'Flex Gear',
    placeholder: 'Partner'
  }

  if (compact) {
    return (
      <Link href={link} className={`block p-4 rounded-2xl border transition-all hover:shadow-md ${bgStyles[type]}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${iconBg[type]}`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label[type]}</span>
              <span className="text-[10px] font-bold text-indigo-600">→</span>
            </div>
            <h4 className={`text-sm font-bold truncate ${titleColor[type]}`}>{title}</h4>
            <p className="text-[11px] text-slate-500 truncate">{description}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={link} className={`block p-6 rounded-3xl border-2 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group ${bgStyles[type]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-110 ${iconBg[type]}`}>
          {icon}
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          type === 'direct' ? 'bg-indigo-100 text-indigo-700' :
          type === 'affiliate' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-200 text-slate-600'
        }`}>
          {label[type]}
        </span>
      </div>
      <h3 className={`text-xl font-black mb-2 tracking-tight ${titleColor[type]}`}>{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed mb-6">
        {description}
      </p>
      <div className={`inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest ${
        type === 'placeholder' ? 'text-slate-400' : 'text-indigo-600'
      }`}>
        {cta}
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  )
}
