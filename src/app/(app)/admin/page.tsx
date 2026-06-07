import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import { UserProfile } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .maybeSingle()

  const profile = profileData as UserProfile | null

  if (!profile?.is_admin) redirect('/predictions')

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  return <AdminClient matches={matches ?? []} />
}
