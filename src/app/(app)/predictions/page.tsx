import { createClient } from '@/lib/supabase/server'
import PredictionsClient from './PredictionsClient'

export const dynamic = 'force-dynamic'

export default async function PredictionsPage() {
  const supabase = createClient()

  // 1. Lock any rounds/matches whose kickoff time has passed
  await supabase.rpc('lock_due_rounds')

  // 2. Auto-sync results if there are locked matches with no score yet
  //    (fires silently — errors are non-fatal)
  const { data: awaitingScores } = await supabase
    .from('matches')
    .select('id')
    .eq('status', 'locked')
    .is('home_score', null)
    .limit(1)

  if (awaitingScores && awaitingScores.length > 0 && process.env.FOOTBALL_DATA_API_KEY) {
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

      await fetch(`${baseUrl}/api/cron/sync-results`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
    } catch {
      // Non-fatal — predictions page still loads
    }
  }

  // 3. Fetch matches AFTER locking + syncing
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  return <PredictionsClient matches={matches ?? []} />
}
