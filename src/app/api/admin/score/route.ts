import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-check'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  const supabase = createClient()
  const { matchId, homeScore, awayScore } = await request.json()

  const { error: matchError } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore, status: 'completed' })
    .eq('id', matchId)

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })

  const { error: pointsError } = await supabase.rpc('calculate_points_for_match', {
    p_match_id: matchId,
  })

  if (pointsError) return NextResponse.json({ error: pointsError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
