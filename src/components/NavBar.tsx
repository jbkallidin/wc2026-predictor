'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavBarProps {
  displayName: string
  isAdmin: boolean
}

export default function NavBar({ displayName, isAdmin }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/predictions', label: 'Predictions' },
    { href: '/leaderboard', label: 'Leaderboard' },
    ...(isAdmin ? [{ href: '/admin', label: '⚙ Admin' }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5"
      style={{ background: 'rgba(10,10,18,0.85)', backdropFilter: 'blur(12px)' }}>
      {/* Gold top stripe */}
      <div className="h-0.5 w-full" style={{
        background: 'linear-gradient(90deg, #FF6B00 0%, #FFD700 40%, #FFA500 70%, #FF6B00 100%)'
      }} />

      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo wordmark */}
        <Link href="/predictions" className="flex items-center gap-2.5 group">
          <span className="text-xl">🏆</span>
          <div className="leading-none">
            <div className="text-[10px] font-bold tracking-[0.2em] text-amber-500/70 uppercase">FIFA World Cup™</div>
            <div className="text-lg font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FF6B00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              2026 Predictor
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                pathname.startsWith(link.href)
                  ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="w-px h-4 bg-gray-700 mx-1" />

          <div className="hidden sm:block text-xs text-gray-600 font-medium max-w-[100px] truncate">
            {displayName}
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 text-xs text-gray-600 hover:text-gray-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
