import { createClient } from '@/lib/supabase/server'
import PredictionsClient from './PredictionsClient'

export const dynamic = 'force-dynamic'

export default async function PredictionsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [matchesRes, predictionsRes, pointsRes] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true }),
    supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user!.id),
    supabase
      .from('points')
      .select('*')
      .eq('user_id', user!.id),
  ])

  return (
    <PredictionsClient
      matches={matchesRes.data ?? []}
      predictions={predictionsRes.data ?? []}
      points={pointsRes.data ?? []}
      userId={user!.id}
    />
  )
}
