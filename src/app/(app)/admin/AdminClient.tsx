'use client'

import { useState, useMemo } from 'react'
import { Match } from '@/lib/database.types'

interface Props {
  matches: Match[]
}

type Tab = 'scores' | 'lock' | 'knockout'

export default function AdminClient({ matches: initialMatches }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const [tab, setTab] = useState<Tab>('scores')
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('')

  const incompleteMatches = useMemo(
    () => matches.filter(m => m.status === 'locked' && m.home_score === null),
    [matches]
  )

  const scheduledRounds = useMemo(() => {
    const groups = new Map<string, Match[]>()
    matches
      .filter(m => m.status === 'scheduled')
      .forEach(m => {
        const key = m.stage === 'group'
          ? `Group Stage MD${m.matchday_round} (Group ${m.group})`
          : m.stage
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(m)
      })
    return groups
  }, [matches])

  async function submitScore(matchId: string) {
    const sc = scores[matchId]
    if (!sc) return
    const home = parseInt(sc.home)
    const away = parseInt(sc.away)
    if (isNaN(home) || isNaN(away)) return

    setSubmitting(prev => ({ ...prev, [matchId]: true }))

    const res = await fetch('/api/admin/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
    })

    setSubmitting(prev => ({ ...prev, [matchId]: false }))

    if (res.ok) {
      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, home_score: home, away_score: away, status: 'completed' } : m
      ))
      setMessage(`Score saved and points calculated!`)
      setTimeout(() => setMessage(''), 3000)
    } else {
      const { error } = await res.json()
      setMessage(`Error: ${error}`)
    }
  }

  async function lockRound(matchIds: string[]) {
    const res = await fetch('/api/admin/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchIds }),
    })
    if (res.ok) {
      setMatches(prev => prev.map(m =>
        matchIds.includes(m.id) ? { ...m, status: 'locked' } : m
      ))
      setMessage('Round locked.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Internal use only</p>
      </div>

      {message && (
        <div className="mb-4 bg-emerald-900/40 border border-emerald-700 text-emerald-400 text-sm px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-0">
        {(['scores', 'lock', 'knockout'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize rounded-t-lg border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            {t === 'scores' ? 'Enter Scores' : t === 'lock' ? 'Lock Rounds' : 'Knockout Bracket'}
          </button>
        ))}
      </div>

      {tab === 'scores' && (
        <div className="space-y-3">
          {incompleteMatches.length === 0 && (
            <div className="text-gray-600 text-center py-10">
              No locked matches awaiting scores.
            </div>
          )}
          {incompleteMatches.map(match => (
            <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                    {match.stage === 'group' ? `Group ${match.group} · MD${match.matchday_round}` : match.stage.toUpperCase()}
                  </div>
                  <div className="font-bold text-white mt-1">
                    {match.home_team} vs {match.away_team}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {new Date(match.kickoff_time).toLocaleString('en-GB')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="20"
                    value={scores[match.id]?.home ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], home: e.target.value } }))}
                    className="w-14 h-12 text-center text-xl font-bold bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                  <span className="text-gray-500 font-bold">–</span>
                  <input
                    type="number" min="0" max="20"
                    value={scores[match.id]?.away ?? ''}
                    onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], away: e.target.value } }))}
                    className="w-14 h-12 text-center text-xl font-bold bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="0"
                  />
                  <button
                    onClick={() => submitScore(match.id)}
                    disabled={submitting[match.id]}
                    className="ml-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    {submitting[match.id] ? '…' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lock' && (
        <div className="space-y-3">
          {scheduledRounds.size === 0 && (
            <div className="text-gray-600 text-center py-10">No open rounds to lock.</div>
          )}
          {Array.from(scheduledRounds.entries()).map(([label, roundMatches]) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">{label}</div>
                <div className="text-sm text-gray-500 mt-0.5">{roundMatches.length} matches</div>
              </div>
              <button
                onClick={() => lockRound(roundMatches.map(m => m.id))}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-semibold rounded-lg text-sm transition-colors"
              >
                Lock now
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'knockout' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-500">
          <p className="font-semibold text-white mb-2">Knockout Bracket Generator</p>
          <p className="text-sm">
            Once all group stage matches are completed, use the API endpoint{' '}
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-orange-400 text-xs">
              POST /api/admin/generate-knockout
            </code>{' '}
            to automatically generate Round of 32 fixtures from group results.
          </p>
        </div>
      )}
    </div>
  )
}
