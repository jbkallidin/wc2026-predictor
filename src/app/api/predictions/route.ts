import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { matchId, predictedHome, predictedAway } = await request.json()

  // Check match is not locked
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'scheduled') {
    return NextResponse.json({ error: 'Predictions are locked for this match' }, { status: 400 })
  }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      match_id: matchId,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
