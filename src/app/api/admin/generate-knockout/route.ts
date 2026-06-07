import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-check'
import { NextResponse } from 'next/server'

const R32_TEMPLATE = [
  { home_slot: 'A1', away_slot: 'B2' },
  { home_slot: 'C1', away_slot: 'D2' },
  { home_slot: 'E1', away_slot: 'F2' },
  { home_slot: 'G1', away_slot: 'H2' },
  { home_slot: 'I1', away_slot: 'J2' },
  { home_slot: 'K1', away_slot: 'L2' },
  { home_slot: 'B1', away_slot: 'A2' },
  { home_slot: 'D1', away_slot: 'C2' },
  { home_slot: 'F1', away_slot: 'E2' },
  { home_slot: 'H1', away_slot: 'G2' },
  { home_slot: 'J1', away_slot: 'I2' },
  { home_slot: 'L1', away_slot: 'K2' },
]

export async function POST() {
  const check = await requireAdmin()
  if (check instanceof NextResponse) return check

  const supabase = createClient()

  const { data: groupMatches } = await supabase
    .from('matches')
    .select('id, status')
    .eq('stage', 'group')

  const typedGroupMatches = groupMatches as { id: string; status: string }[] | null
  const allCompleted = typedGroupMatches?.every(m => m.status === 'completed')
  if (!allCompleted) {
    return NextResponse.json({ error: 'Not all group stage matches are completed' }, { status: 400 })
  }

  const { data: completedMatches } = await supabase
    .from('matches')
    .select('group, home_team, away_team, home_score, away_score')
    .eq('stage', 'group')
    .eq('status', 'completed')

  type MatchRow = { group: string | null; home_team: string; away_team: string; home_score: number | null; away_score: number | null }
  const typed = completedMatches as MatchRow[] | null
  if (!typed) return NextResponse.json({ error: 'Could not fetch matches' }, { status: 500 })

  const standings: Record<string, Record<string, { pts: number; gd: number; gf: number }>> = {}

  typed.forEach(m => {
    const grp = m.group!
    if (!standings[grp]) standings[grp] = {}

    const init = (team: string) => {
      if (!standings[grp][team]) standings[grp][team] = { pts: 0, gd: 0, gf: 0 }
    }

    init(m.home_team)
    init(m.away_team)

    const hs = m.home_score!, as_ = m.away_score!
    standings[grp][m.home_team].gf += hs
    standings[grp][m.away_team].gf += as_
    standings[grp][m.home_team].gd += hs - as_
    standings[grp][m.away_team].gd += as_ - hs

    if (hs > as_) standings[grp][m.home_team].pts += 3
    else if (hs < as_) standings[grp][m.away_team].pts += 3
    else { standings[grp][m.home_team].pts += 1; standings[grp][m.away_team].pts += 1 }
  })

  const groupRankings: Record<string, string[]> = {}
  Object.entries(standings).forEach(([grp, teams]) => {
    groupRankings[grp] = Object.entries(teams)
      .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .map(([team]) => team)
  })

  const slotMap: Record<string, string> = {}
  Object.entries(groupRankings).forEach(([grp, teams]) => {
    teams.forEach((team, idx) => { slotMap[`${grp}${idx + 1}`] = team })
  })

  const baseTime = new Date('2026-07-04T15:00:00Z')
  const r32Fixtures = R32_TEMPLATE.map((fixture, i) => ({
    stage: 'r32' as const,
    home_team: slotMap[fixture.home_slot] ?? `TBD (${fixture.home_slot})`,
    away_team: slotMap[fixture.away_slot] ?? `TBD (${fixture.away_slot})`,
    kickoff_time: new Date(baseTime.getTime() + Math.floor(i / 4) * 86400000 + (i % 4) * 4 * 3600000).toISOString(),
    status: 'scheduled' as const,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('matches').insert(r32Fixtures as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, fixtures: r32Fixtures.length })
}
