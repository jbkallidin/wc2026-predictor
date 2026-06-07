import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { UserProfile } from '@/lib/database.types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const profile = profileData as UserProfile | null

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar displayName={profile?.display_name ?? ''} isAdmin={profile?.is_admin ?? false} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
