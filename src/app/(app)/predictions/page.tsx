import { createClient } from '@/lib/supabase/server'
import PredictionsClient from './PredictionsClient'

export const dynamic = 'force-dynamic'

export default async function PredictionsPage() {
  const supabase = createClient()

  // Only fetch matches server-side (public data, no auth complexity)
  // Predictions and points are fetched client-side to ensure auth is always correct
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  return <PredictionsClient matches={matches ?? []} />
}
