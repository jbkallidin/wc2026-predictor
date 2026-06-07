'use client'

import { useState, useMemo } from 'react'
import { Match, Prediction, Points } from '@/lib/database.types'
import MatchCard from '@/components/MatchCard'

interface Props {
  matches: Match[]
  predictions: Prediction[]
  points: Points[]
  userId?: string
}

type RoundKey = string

function getRoundLabel(match: Match): RoundKey {
  if (match.stage === 'group') return `Group Stage — Matchday ${match.matchday_round}`
  const labels: Record<string, string> = {
    r32: 'Round of 32',
    r16: 'Round of 16',
    qf: 'Quarter-finals',
    sf: 'Semi-finals',
    final: 'Final',
  }
  return labels[match.stage] ?? match.stage
}

function getRoundOrder(match: Match): number {
  if (match.stage === 'group') return match.matchday_round! - 1
  const order: Record<string, number> = { r32: 3, r16: 4, qf: 5, sf: 6, final: 7 }
  return order[match.stage] ?? 10
}

function getRoundStatus(matches: Match[]): 'scheduled' | 'locked' | 'completed' {
  if (matches.every(m => m.status === 'completed')) return 'completed'
  if (matches.some(m => m.status === 'locked' || m.status === 'completed')) return 'locked'
  return 'scheduled'
}

export default function PredictionsClient({ matches, predictions, points }: Props) {
  const [localPredictions, setLocalPredictions] = useState<Record<string, { home: string; away: string }>>(() => {
    const map: Record<string, { home: string; away: string }> = {}
    predictions.forEach(p => {
      map[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) }
    })
    return map
  })
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const pointsMap = useMemo(() => {
    const map: Record<string, Points> = {}
    points.forEach(p => { map[p.match_id] = p })
    return map
  }, [points])

  // Group matches into rounds, then within each round group by group letter
  const rounds = useMemo(() => {
    const grouped = new Map<RoundKey, Match[]>()
    matches.forEach(match => {
      const key = getRoundLabel(match)
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(match)
    })

    return Array.from(grouped.entries())
      .map(([label, roundMatches]) => {
        // Within each round, sub-group by group letter (for group stage) or keep flat (knockout)
        const subGroups = new Map<string, Match[]>()
        roundMatches.forEach(m => {
          const key = m.group ? `Group ${m.group}` : 'Matches'
          if (!subGroups.has(key)) subGroups.set(key, [])
          subGroups.get(key)!.push(m)
        })

        return {
          label,
          subGroups: Array.from(subGroups.entries()).sort(([a], [b]) => a.localeCompare(b)),
          allMatches: roundMatches,
          status: getRoundStatus(roundMatches),
          order: getRoundOrder(roundMatches[0]),
        }
      })
      .sort((a, b) => a.order - b.order)
  }, [matches])

  // Default open: first non-completed round
  const activeRoundLabel = rounds.find(r => r.status !== 'completed')?.label ?? rounds[rounds.length - 1]?.label
  const [openRound, setOpenRound] = useState<string | null>(activeRoundLabel ?? null)

  async function savePrediction(matchId: string) {
    const pred = localPredictions[matchId]
    if (!pred) return

    const home = parseInt(pred.home)
    const away = parseInt(pred.away)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 20 || away > 20) {
      setErrors(prev => ({ ...prev, [matchId]: 'Enter scores 0–20' }))
      return
    }

    setSaving(prev => ({ ...prev, [matchId]: true }))
    setErrors(prev => ({ ...prev, [matchId]: '' }))

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, predictedHome: home, predictedAway: away }),
    })

    setSaving(prev => ({ ...prev, [matchId]: false }))

    if (res.ok) {
      setSaved(prev => ({ ...prev, [matchId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [matchId]: false })), 2000)
    } else {
      const { error } = await res.json()
      setErrors(prev => ({ ...prev, [matchId]: error ?? 'Failed to save' }))
    }
  }

  function updateHome(matchId: string, val: string) {
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: { home: val, away: prev[matchId]?.away ?? '' }
    }))
  }

  function updateAway(matchId: string, val: string) {
    setLocalPredictions(prev => ({
      ...prev,
      [matchId]: { home: prev[matchId]?.home ?? '', away: val }
    }))
  }

  return (
    <div className="space-y-3">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Your Predictions</h1>
        <p className="text-gray-500 text-sm mt-1">1 pt correct result · 3 pts exact score</p>
      </div>

      {rounds.map(round => (
        <div key={round.label} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Round header */}
          <button
            onClick={() => setOpenRound(openRound === round.label ? null : round.label)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">{round.label}</span>
              <StatusBadge status={round.status} />
            </div>
            <span className="text-gray-500 text-xs">{openRound === round.label ? '▲' : '▼'}</span>
          </button>

          {openRound === round.label && (
            <div className="border-t border-gray-800">
              {round.subGroups.map(([groupLabel, groupMatches]) => (
                <div key={groupLabel}>
                  {/* Group sub-header */}
                  <div className="px-5 py-2 bg-gray-800/60 border-b border-gray-800">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {groupLabel}
                    </span>
                  </div>

                  {/* Matches in this group */}
                  <div className="divide-y divide-gray-800/70">
                    {groupMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={localPredictions[match.id]}
                        points={pointsMap[match.id]}
                        isSaving={saving[match.id]}
                        isSaved={saved[match.id]}
                        error={errors[match.id]}
                        isLocked={match.status !== 'scheduled'}
                        onHomeChange={val => updateHome(match.id, val)}
                        onAwayChange={val => updateAway(match.id, val)}
                        onSave={() => savePrediction(match.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: 'scheduled' | 'locked' | 'completed' }) {
  if (status === 'scheduled') return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      Open
    </span>
  )
  if (status === 'locked') return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
      Locked
    </span>
  )
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700/60 text-gray-400 border border-gray-700">
      Completed
    </span>
  )
}
