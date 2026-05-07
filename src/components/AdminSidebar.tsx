'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Control Room', href: '/admin', icon: '🎮' },
  { name: 'Expansion', href: '/admin/chapters', icon: '🚀' },
  { name: 'Integrity', href: '/admin/flags', icon: '⚖️' },
  { name: 'Performance', href: '/admin/performance', icon: '📊' },
  { name: 'Promotions', href: '/admin/promotions', icon: '💰' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 hidden md:block border-r border-slate-800">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 mb-10 group">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black group-hover:bg-indigo-400 transition-colors">
            TF
          </div>
          <span className="font-black text-xl tracking-tight">Admin</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Link 
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <span>🏠</span>
          Exit to Player View
        </Link>
      </div>
    </aside>
  )
}
