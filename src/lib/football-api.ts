/**
 * Football-data.org API integration for WC 2026 results
 * Free tier: https://www.football-data.org/client/register
 * Docs: https://docs.football-data.org/general/v4/
 */

const API_BASE = 'https://api.football-data.org/v4'
const COMPETITION_CODE = 'WC'

export interface ApiMatch {
  id: number
  utcDate: string
  status: string
  stage?: string
  homeTeam: { name: string | null; tla: string | null }
  awayTeam: { name: string | null; tla: string | null }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}

// Normalise team names from the API to match our DB
// football-data.org may use different names/spellings
const API_NAME_MAP: Record<string, string> = {
  // Common differences
  'USA':                         'United States',
  'United States':               'United States',
  'Turkey':                      'Türkiye',
  'Türkiye':                     'Türkiye',
  "Côte d'Ivoire":               'Ivory Coast',
  'Ivory Coast':                 'Ivory Coast',
  'Curacao':                     'Curaçao',
  'Curaçao':                     'Curaçao',
  'Congo DR':                    'DR Congo',
  'DR Congo':                    'DR Congo',
  'Democratic Republic of Congo':'DR Congo',
  'Bosnia-Herzegovina':          'Bosnia and Herzegovina',
  'Bosnia & Herzegovina':        'Bosnia and Herzegovina',
  'Bosnia and Herzegovina':      'Bosnia and Herzegovina',
  'Korea Republic':              'South Korea',
  'Republic of Korea':           'South Korea',
  'South Korea':                 'South Korea',
  'Czech Republic':              'Czechia',
  'Czechia':                     'Czechia',
  'Cabo Verde':                  'Cape Verde',
  'Cape Verde':                  'Cape Verde',
  'New Zealand':                 'New Zealand',
  'England':                     'England',
  'Scotland':                    'Scotland',
  'Saudi Arabia':                'Saudi Arabia',
  'South Africa':                'South Africa',
}

export function normaliseName(name: string): string {
  return API_NAME_MAP[name] ?? name
}

export async function fetchFinishedMatches(apiKey: string): Promise<ApiMatch[]> {
  const res = await fetch(
    `${API_BASE}/competitions/${COMPETITION_CODE}/matches?status=FINISHED`,
    {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Football API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (data.matches ?? []) as ApiMatch[]
}

// Fetch ALL matches (any status/stage) — used to load knockout fixtures
export async function fetchAllMatches(apiKey: string): Promise<ApiMatch[]> {
  const res = await fetch(
    `${API_BASE}/competitions/${COMPETITION_CODE}/matches`,
    {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Football API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (data.matches ?? []) as ApiMatch[]
}
