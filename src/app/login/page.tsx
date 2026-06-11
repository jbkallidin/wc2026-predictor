'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import WC2026Logo from '@/components/WC2026Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/predictions')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF6B00, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <WC2026Logo size="lg" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(20,20,32,0.9)', backdropFilter: 'blur(20px)' }}>

          {/* Card top stripe */}
          <div className="h-0.5 w-full" style={{
            background: 'linear-gradient(90deg, #FF6B00, #FFD700, #FF6B00)'
          }} />

          <div className="p-8">
            <h2 className="text-xl font-black text-white mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your predictions for every match</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  placeholder="••••••••"
                />
                <div className="text-right mt-2">
                  <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
              {error && (
                <div className="bg-red-950/60 border border-red-800/60 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C00)' }}
              >
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-6">
              No account?{' '}
              <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          wc2026picks.vercel.app
        </p>
      </div>
    </div>
  )
}
