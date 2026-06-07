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
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <nav className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="text-xl mr-3">⚽</span>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{displayName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
