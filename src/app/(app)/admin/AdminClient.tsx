'use client'

import { useState, useMemo } from 'react'
import { Match } from '@/lib/database.types'

interface Props {
  matches: Match[]
}

type Tab = 'results' | 'lock' | 'knockout'

interface SyncResult {
  synced: number
  checked: number
  pending: number
  message: string
  errors?: string[]
}

export default function AdminClient({ matches: initialMatches }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const [tab, setTab] = useState<Tab>('results')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // ── Results sync ────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    setMessage(null)

    const res = await fetch('/api/admin/sync-results', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)

    if (!res.ok) {
      setMessage({ text: data.error ?? 'Sync failed', type: 'error' })
    } else {
      setSyncResult(data)
      if (data.synced > 0) {
        // Refresh matches list
        const r = await fetch('/api/admin/matches')
        if (r.ok) setMatches(await r.json())
      }
    }
  }

  // ── Manual score entry (fallback) ───────────────────────────────────
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  const incompleteMatches = useMemo(
    () => matches.filter(m => m.status === 'locked' && m.home_score === null),
    [matches]
  )

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
      setMessage({ text: 'Score saved and points calculated.', type: 'success' })
      setTimeout(() => setMessage(null), 4000)
    } else {
      const { error } = await res.json()
      setMessage({ text: `Error: ${error}`, type: 'error' })
    }
  }

  // ── Lock rounds ─────────────────────────────────────────────────────
  const scheduledRounds = useMemo(() => {
    const groups = new Map<string, Match[]>()
    matches
      .filter(m => m.status === 'scheduled')
      .forEach(m => {
        const key = m.stage === 'group'
          ? `Group Stage MD${m.matchday_round} — Group ${m.group}`
          : m.stage.toUpperCase()
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(m)
      })
    return groups
  }, [matches])

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
      setMessage({ text: 'Round locked.', type: 'success' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const completedCount = matches.filter(m => m.status === 'completed').length
  const lockedCount = matches.filter(m => m.status === 'locked').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Admin Panel</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <span><span className="text-emerald-400 font-semibold">{completedCount}</span> completed</span>
          <span><span className="text-amber-400 font-semibold">{lockedCount}</span> locked (awaiting scores)</span>
        </div>
      </div>

      {message && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400'
            : 'bg-red-950/60 border-red-700/60 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/8 pb-0">
        {(['results', 'lock', 'knockout'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors capitalize ${
              tab === t
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            {t === 'results' ? 'Match Results' : t === 'lock' ? 'Lock Rounds' : 'Knockout Bracket'}
          </button>
        ))}
      </div>

      {/* ── RESULTS TAB ── */}
      {tab === 'results' && (
        <div className="space-y-5">

          {/* Auto-sync card */}
          <div className="rounded-2xl border border-white/8 overflow-hidden"
            style={{ background: 'rgba(16,16,26,0.8)' }}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-white">Auto-sync from football-data.org</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Fetches finished match scores and calculates points automatically.
                  </p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C00)' }}
                >
                  {syncing ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      Syncing…
                    </>
                  ) : '⟳ Sync Results'}
                </button>
              </div>

              {syncResult && (
                <div className={`mt-4 p-4 rounded-xl border text-sm ${
                  syncResult.synced > 0
                    ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-400'
                    : 'bg-gray-800/40 border-gray-700/40 text-gray-400'
                }`}>
                  <p className="font-semibold">{syncResult.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    Checked {syncResult.checked} API results · {syncResult.pending} matches awaiting scores
                  </p>
                  {syncResult.errors?.map((e, i) => (
                    <p key={i} className="text-xs text-red-400 mt-1">⚠ {e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Setup notice if no API key */}
            <div className="px-5 pb-4 border-t border-white/5 pt-4">
              <p className="text-xs text-gray-600">
                Requires <code className="text-orange-400 bg-gray-800 px-1 py-0.5 rounded">FOOTBALL_DATA_API_KEY</code> environment variable.{' '}
                <a href="https://www.football-data.org/client/register" target="_blank" rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-400 underline">
                  Get a free API key →
                </a>
              </p>
            </div>
          </div>

          {/* Manual score entry fallback */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Manual entry — fallback
            </h3>

            {incompleteMatches.length === 0 && (
              <div className="rounded-xl border border-white/5 p-8 text-center text-gray-600 text-sm">
                No locked matches awaiting scores.
              </div>
            )}

            <div className="space-y-3">
              {incompleteMatches.map(match => (
                <div key={match.id}
                  className="rounded-xl border border-white/8 p-4 flex items-center justify-between gap-4 flex-wrap"
                  style={{ background: 'rgba(16,16,26,0.8)' }}>
                  <div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                      {match.stage === 'group' ? `Group ${match.group} · MD${match.matchday_round}` : match.stage.toUpperCase()}
                    </div>
                    <div className="font-bold text-white mt-0.5">
                      {match.home_team} vs {match.away_team}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {new Date(match.kickoff_time).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="20"
                      value={scores[match.id]?.home ?? ''}
                      onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], home: e.target.value } }))}
                      className="score-input"
                      placeholder="0"
                    />
                    <span className="text-gray-500 font-bold">–</span>
                    <input
                      type="number" min="0" max="20"
                      value={scores[match.id]?.away ?? ''}
                      onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], away: e.target.value } }))}
                      className="score-input"
                      placeholder="0"
                    />
                    <button
                      onClick={() => submitScore(match.id)}
                      disabled={submitting[match.id]}
                      className="ml-1 px-4 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C00)' }}
                    >
                      {submitting[match.id] ? '…' : 'Submit'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOCK TAB ── */}
      {tab === 'lock' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            Rounds lock automatically at kickoff. Use this to lock early if needed.
          </p>
          {scheduledRounds.size === 0 && (
            <div className="rounded-xl border border-white/5 p-8 text-center text-gray-600 text-sm">
              No open rounds to lock.
            </div>
          )}
          {Array.from(scheduledRounds.entries()).map(([label, roundMatches]) => (
            <div key={label}
              className="rounded-xl border border-white/8 p-4 flex items-center justify-between gap-4"
              style={{ background: 'rgba(16,16,26,0.8)' }}>
              <div>
                <div className="font-bold text-white">{label}</div>
                <div className="text-sm text-gray-500 mt-0.5">{roundMatches.length} matches</div>
              </div>
              <button
                onClick={() => lockRound(roundMatches.map(m => m.id))}
                className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-semibold rounded-xl text-sm transition-colors"
              >
                Lock now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── KNOCKOUT TAB ── */}
      {tab === 'knockout' && (
        <div className="rounded-2xl border border-white/8 p-6 text-center"
          style={{ background: 'rgba(16,16,26,0.8)' }}>
          <p className="text-lg font-bold text-white mb-2">Knockout Bracket Generator</p>
          <p className="text-sm text-gray-500 mb-4">
            Once all group stage matches are complete, generate the Round of 32 fixtures.
          </p>
          <code className="bg-gray-800 px-3 py-1.5 rounded-lg text-orange-400 text-xs">
            POST /api/admin/generate-knockout
          </code>
        </div>
      )}
    </div>
  )
}
