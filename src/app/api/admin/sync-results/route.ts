import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/supabase/admin-check'
import { fetchFinishedMatches, normaliseName } from '@/lib/football-api'
import { NextResponse } from 'next/server'

export async function POST() {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check
  return runSync()
}

// Also allow GET for cron calls (protected by CRON_SECRET)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  // Diagnostic mode: compare raw API fixtures against pending DB matches
  if (new URL(request.url).searchParams.get('debug') === '1') {
    return runDebug()
  }
  return runSync()
}

async function runDebug() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no api key' }, { status: 500 })
  const supabase = createServiceClient()

  const apiMatches = await fetchFinishedMatches(apiKey)
  const { data: pending } = await supabase
    .from('matches')
    .select('home_team, away_team, kickoff_time')
    .in('status', ['locked', 'scheduled'])
    .is('home_score', null)

  return NextResponse.json({
    api: apiMatches.map(m => ({
      home: m.homeTeam.name,
      homeNorm: normaliseName(m.homeTeam.name),
      away: m.awayTeam.name,
      awayNorm: normaliseName(m.awayTeam.name),
      utcDate: m.utcDate,
      score: m.score.fullTime,
    })),
    pending: pending?.map(p => ({
      home: p.home_team, away: p.away_team, kickoff: p.kickoff_time,
    })),
  })
}

async function runSync() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'FOOTBALL_DATA_API_KEY not set. Add it to your environment variables.' },
      { status: 500 }
    )
  }

  // Use the service-role client: this job is authenticated by CRON_SECRET
  // (or requireAdmin above) and must bypass RLS to read/update matches
  // and write points without a user session.
  const supabase = createServiceClient()

  // 1. Fetch all FINISHED matches from the football API
  let apiMatches
  try {
    apiMatches = await fetchFinishedMatches(apiKey)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (!apiMatches.length) {
    return NextResponse.json({ synced: 0, message: 'No finished matches from API yet' })
  }

  // 2. Get all our locked matches that don't have scores yet
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_time')
    .eq('status', 'locked')
    .is('home_score', null)

  if (!pendingMatches?.length) {
    return NextResponse.json({ synced: 0, message: 'No locked matches awaiting scores' })
  }

  // 3. Match API results to our DB rows
  let synced = 0
  const errors: string[] = []

  for (const apiMatch of apiMatches) {
    const { fullTime } = apiMatch.score
    if (fullTime.home === null || fullTime.away === null) continue

    const apiHome = normaliseName(apiMatch.homeTeam.name)
    const apiAway = normaliseName(apiMatch.awayTeam.name)
    const apiKickoff = new Date(apiMatch.utcDate).getTime()

    // Find matching DB row: same teams + kickoff within a generous window.
    // Each team pairing is unique in the group stage, so matching on the
    // ordered team pair is reliable; the wide time window only guards against
    // an unlikely knockout rematch (which would be weeks apart) while
    // absorbing seed/schedule/timezone drift (observed up to several hours).
    const dbMatch = pendingMatches.find(m => {
      const dbHome = m.home_team
      const dbAway = m.away_team
      const dbKickoff = new Date(m.kickoff_time).getTime()
      const kickoffDiff = Math.abs(apiKickoff - dbKickoff)
      const teamsMatch = dbHome === apiHome && dbAway === apiAway
      return teamsMatch && kickoffDiff < 48 * 60 * 60 * 1000
    })

    if (!dbMatch) continue

    // 4. Update match score and status
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        home_score: fullTime.home,
        away_score: fullTime.away,
        status: 'completed',
      })
      .eq('id', dbMatch.id)

    if (updateError) {
      errors.push(`${apiHome} vs ${apiAway}: ${updateError.message}`)
      continue
    }

    // 5. Calculate points for all predictions on this match
    const { error: pointsError } = await supabase.rpc('calculate_points_for_match', {
      p_match_id: dbMatch.id,
    })

    if (pointsError) {
      errors.push(`Points calc for ${apiHome} vs ${apiAway}: ${pointsError.message}`)
      continue
    }

    synced++
  }

  return NextResponse.json({
    synced,
    checked: apiMatches.length,
    pending: pendingMatches.length,
    errors: errors.length ? errors : undefined,
    message: synced
      ? `✓ Synced ${synced} result${synced > 1 ? 's' : ''} and calculated points`
      : 'No new results to sync',
  })
}
