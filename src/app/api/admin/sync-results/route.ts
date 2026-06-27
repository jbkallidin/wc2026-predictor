import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/supabase/admin-check'
import { fetchFinishedMatches, fetchAllMatches, normaliseName } from '@/lib/football-api'
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
  const debug = new URL(request.url).searchParams.get('debug')
  if (debug === '1') {
    return runDebug()
  }
  // Stage breakdown: show all API fixtures grouped by stage (for loading knockouts)
  if (debug === 'stages') {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'no api key' }, { status: 500 })
    const all = await fetchAllMatches(apiKey)
    const byStage: Record<string, number> = {}
    all.forEach(m => { byStage[m.stage ?? 'UNKNOWN'] = (byStage[m.stage ?? 'UNKNOWN'] ?? 0) + 1 })
    return NextResponse.json({
      counts: byStage,
      fixtures: all.map(m => ({
        stage: m.stage,
        status: m.status,
        home: m.homeTeam.name,
        away: m.awayTeam.name,
        utcDate: m.utcDate,
      })),
    })
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

  // 2. Get all our locked matches that don't have scores yet
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_time')
    .eq('status', 'locked')
    .is('home_score', null)

  // 3. Match API results to our group-stage DB rows
  let synced = 0
  const errors: string[] = []

  for (const apiMatch of pendingMatches?.length ? apiMatches : []) {
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
    const dbMatch = pendingMatches!.find(m => {
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

  // 6. Sync knockout fixtures (create/update teams, kickoff & scores by API id).
  //    Runs every time so the bracket fills in as the draw is decided.
  let knockout = { upserted: 0, completed: 0, errors: [] as string[] }
  try {
    knockout = await syncKnockoutFixtures(supabase, apiKey)
  } catch (err: unknown) {
    errors.push(`knockout sync: ${err instanceof Error ? err.message : String(err)}`)
  }

  return NextResponse.json({
    synced,
    knockoutFixtures: knockout.upserted,
    knockoutCompleted: knockout.completed,
    errors: [...errors, ...knockout.errors].length ? [...errors, ...knockout.errors] : undefined,
    message: `✓ Group results synced: ${synced}; knockout fixtures updated: ${knockout.upserted}`,
  })
}

// Maps football-data.org knockout stage names to our internal stage codes
const KO_STAGE_MAP: Record<string, string> = {
  LAST_32: 'r32',
  LAST_16: 'r16',
  QUARTER_FINALS: 'qf',
  SEMI_FINALS: 'sf',
  THIRD_PLACE: 'third',
  FINAL: 'final',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncKnockoutFixtures(supabase: any, apiKey: string) {
  const all = await fetchAllMatches(apiKey)
  const ko = all.filter(m => m.stage && KO_STAGE_MAP[m.stage])

  let upserted = 0
  let completed = 0
  const errors: string[] = []

  for (const m of ko) {
    const stage = KO_STAGE_MAP[m.stage!]
    const home = m.homeTeam.name ? normaliseName(m.homeTeam.name) : 'TBD'
    const away = m.awayTeam.name ? normaliseName(m.awayTeam.name) : 'TBD'
    const isFinished = m.status === 'FINISHED' && m.score.fullTime.home !== null

    const { data: existing } = await supabase
      .from('matches')
      .select('id, home_score')
      .eq('api_match_id', m.id)
      .maybeSingle()

    if (!existing) {
      // New knockout fixture — insert it
      const status = isFinished
        ? 'completed'
        : m.status === 'IN_PLAY' || m.status === 'PAUSED'
        ? 'locked'
        : 'scheduled'
      const { data: inserted, error } = await supabase
        .from('matches')
        .insert({
          api_match_id: m.id,
          stage,
          home_team: home,
          away_team: away,
          kickoff_time: m.utcDate,
          home_score: isFinished ? m.score.fullTime.home : null,
          away_score: isFinished ? m.score.fullTime.away : null,
          status,
        })
        .select('id')
        .single()
      if (error) { errors.push(`insert ${home} v ${away}: ${error.message}`); continue }
      upserted++
      if (isFinished && inserted) {
        await supabase.rpc('calculate_points_for_match', { p_match_id: inserted.id })
        completed++
      }
    } else {
      // Existing fixture — refresh teams/kickoff; set score once finished.
      // Never downgrade a locked/completed status back to scheduled here;
      // time-based locking is handled by lock_due_rounds.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: Record<string, any> = {
        home_team: home,
        away_team: away,
        kickoff_time: m.utcDate,
      }
      const newlyFinished = isFinished && existing.home_score === null
      if (newlyFinished) {
        update.home_score = m.score.fullTime.home
        update.away_score = m.score.fullTime.away
        update.status = 'completed'
      }
      const { error } = await supabase.from('matches').update(update).eq('id', existing.id)
      if (error) { errors.push(`update ${home} v ${away}: ${error.message}`); continue }
      upserted++
      if (newlyFinished) {
        await supabase.rpc('calculate_points_for_match', { p_match_id: existing.id })
        completed++
      }
    }
  }

  return { upserted, completed, errors }
}
