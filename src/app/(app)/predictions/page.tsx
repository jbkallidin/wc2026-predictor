import { createClient } from '@/lib/supabase/server'
import PredictionsClient from './PredictionsClient'

export const dynamic = 'force-dynamic'

export default async function PredictionsPage() {
  const supabase = createClient()

  // Lock any rounds/matches whose kickoff time has passed.
  // This runs on every page load as an instant fallback — the pg_cron
  // job in Supabase also fires every minute for background coverage.
  await supabase.rpc('lock_due_rounds')

  // Fetch matches AFTER locking so the UI always reflects current status
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  return <PredictionsClient matches={matches ?? []} />
}
