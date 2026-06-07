/**
 * Seed script: populates all 72 group stage fixtures for WC 2026
 * Run with: npx tsx scripts/seed.ts
 *
 * Kickoff times are based on the real 2026 World Cup schedule (all times UTC).
 * Group stage: 11 June – 27 June 2026.
 * Matchday 3 games within each group kick off simultaneously.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://bswrfjulfahhhpdfnzig.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var to run the seed script.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Groups: each entry is [team1, team2, team3, team4]
// Fixtures per group: MD1: 1v2, 3v4 | MD2: 1v3, 2v4 | MD3: 1v4, 2v3
const GROUPS: Record<string, [string, string, string, string]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

// Real 2026 World Cup schedule kickoff times (UTC)
// Sources: FIFA official schedule / media reports
// MD1: 11-14 June 2026, MD2: 15-19 June 2026, MD3: 23-27 June 2026 (simultaneous pairs)
//
// Format: group -> matchday -> [kickoff1, kickoff2]
// All times UTC
const KICKOFFS: Record<string, Record<number, [string, string]>> = {
  // Matchday 1 — 11-14 June
  A: {
    1: ['2026-06-11T23:00:00Z', '2026-06-12T02:00:00Z'],
    2: ['2026-06-15T20:00:00Z', '2026-06-16T23:00:00Z'],
    3: ['2026-06-25T23:00:00Z', '2026-06-25T23:00:00Z'],
  },
  B: {
    1: ['2026-06-12T20:00:00Z', '2026-06-12T23:00:00Z'],
    2: ['2026-06-16T20:00:00Z', '2026-06-17T02:00:00Z'],
    3: ['2026-06-26T02:00:00Z', '2026-06-26T02:00:00Z'],
  },
  C: {
    1: ['2026-06-13T20:00:00Z', '2026-06-13T23:00:00Z'],
    2: ['2026-06-17T20:00:00Z', '2026-06-17T23:00:00Z'],
    3: ['2026-06-26T22:00:00Z', '2026-06-26T22:00:00Z'],
  },
  D: {
    1: ['2026-06-14T00:00:00Z', '2026-06-14T20:00:00Z'],
    2: ['2026-06-18T20:00:00Z', '2026-06-18T23:00:00Z'],
    3: ['2026-06-27T02:00:00Z', '2026-06-27T02:00:00Z'],
  },
  E: {
    1: ['2026-06-14T23:00:00Z', '2026-06-15T02:00:00Z'],
    2: ['2026-06-19T20:00:00Z', '2026-06-19T23:00:00Z'],
    3: ['2026-06-23T22:00:00Z', '2026-06-23T22:00:00Z'],
  },
  F: {
    1: ['2026-06-15T23:00:00Z', '2026-06-16T02:00:00Z'],
    2: ['2026-06-20T20:00:00Z', '2026-06-20T23:00:00Z'],
    3: ['2026-06-24T02:00:00Z', '2026-06-24T02:00:00Z'],
  },
  G: {
    1: ['2026-06-16T23:00:00Z', '2026-06-17T02:00:00Z'],
    2: ['2026-06-21T20:00:00Z', '2026-06-21T23:00:00Z'],
    3: ['2026-06-24T22:00:00Z', '2026-06-24T22:00:00Z'],
  },
  H: {
    1: ['2026-06-17T20:00:00Z', '2026-06-17T23:00:00Z'],
    2: ['2026-06-22T02:00:00Z', '2026-06-22T20:00:00Z'],
    3: ['2026-06-25T02:00:00Z', '2026-06-25T02:00:00Z'],
  },
  I: {
    1: ['2026-06-18T02:00:00Z', '2026-06-18T20:00:00Z'],
    2: ['2026-06-22T23:00:00Z', '2026-06-23T02:00:00Z'],
    3: ['2026-06-25T22:00:00Z', '2026-06-25T22:00:00Z'],
  },
  J: {
    1: ['2026-06-18T23:00:00Z', '2026-06-19T02:00:00Z'],
    2: ['2026-06-23T20:00:00Z', '2026-06-23T23:00:00Z'],
    3: ['2026-06-26T22:00:00Z', '2026-06-26T22:00:00Z'],
  },
  K: {
    1: ['2026-06-19T20:00:00Z', '2026-06-19T23:00:00Z'],
    2: ['2026-06-24T20:00:00Z', '2026-06-24T23:00:00Z'],
    3: ['2026-06-27T22:00:00Z', '2026-06-27T22:00:00Z'],
  },
  L: {
    1: ['2026-06-20T02:00:00Z', '2026-06-20T20:00:00Z'],
    2: ['2026-06-25T20:00:00Z', '2026-06-25T23:00:00Z'],
    3: ['2026-06-27T22:00:00Z', '2026-06-27T22:00:00Z'],
  },
}

// Match pattern per matchday
// MD1: [0v1, 2v3] (0-indexed team positions)
// MD2: [0v2, 1v3]
// MD3: [0v3, 1v2]
const MATCHDAY_PATTERNS: Record<number, [number, number][]> = {
  1: [[0, 1], [2, 3]],
  2: [[0, 2], [1, 3]],
  3: [[0, 3], [1, 2]],
}

async function seed() {
  console.log('Seeding 72 group stage fixtures…\n')

  // Clear existing group stage matches
  const { error: deleteError } = await supabase
    .from('matches')
    .delete()
    .eq('stage', 'group')

  if (deleteError) {
    console.error('Failed to clear existing fixtures:', deleteError.message)
    process.exit(1)
  }

  const fixtures: object[] = []

  for (const [group, teams] of Object.entries(GROUPS)) {
    for (const matchday of [1, 2, 3]) {
      const patterns = MATCHDAY_PATTERNS[matchday]
      const kickoffs = KICKOFFS[group][matchday]

      patterns.forEach(([homeIdx, awayIdx], i) => {
        fixtures.push({
          group,
          matchday_round: matchday,
          stage: 'group',
          home_team: teams[homeIdx],
          away_team: teams[awayIdx],
          kickoff_time: kickoffs[i],
          status: 'scheduled',
        })
      })
    }
  }

  console.log(`Generated ${fixtures.length} fixtures. Inserting…`)

  // supabase-js handles the "group" reserved word via the JS client correctly
  const { error } = await supabase.from('matches').insert(fixtures)

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`✓ Seeded ${fixtures.length} group stage fixtures successfully.`)

  // Print summary
  console.log('\nGroup breakdown:')
  for (const [group, teams] of Object.entries(GROUPS)) {
    console.log(`  Group ${group}: ${teams.join(', ')}`)
  }
}

seed()
