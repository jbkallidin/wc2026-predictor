import { Match, Points } from '@/lib/database.types'
import { flag } from '@/lib/flags'

interface Props {
  match: Match
  prediction?: { home: string; away: string }
  points?: Points
  isSaving?: boolean
  isSaved?: boolean
  error?: string
  isLocked: boolean
  onHomeChange: (val: string) => void
  onAwayChange: (val: string) => void
  onSave: () => void
}

export default function MatchCard({
  match, prediction, points, isSaving, isSaved, error, isLocked,
  onHomeChange, onAwayChange, onSave
}: Props) {
  const isCompleted = match.status === 'completed'
  const kickoff = new Date(match.kickoff_time)

  const hasPrediction = prediction?.home !== undefined && prediction?.away !== undefined &&
    prediction.home !== '' && prediction.away !== ''

  let borderClass = ''
  if (isCompleted && points) {
    if (points.is_exact_score) borderClass = 'border-l-4 border-l-emerald-500'
    else if (points.points_awarded === 1) borderClass = 'border-l-4 border-l-blue-500'
    else if (hasPrediction) borderClass = 'border-l-4 border-l-red-500'
  }

  return (
    <div className={`px-4 py-3.5 ${borderClass}`}>
      <div className="flex items-center justify-between gap-3">
        {/* Teams */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-600 mb-1">
            {kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' · '}
            {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg leading-none">{flag(match.home_team)}</span>
            <span className="font-semibold text-white text-sm">{match.home_team}</span>
            <span className="text-gray-600 text-xs mx-1">vs</span>
            <span className="font-semibold text-white text-sm">{match.away_team}</span>
            <span className="text-lg leading-none">{flag(match.away_team)}</span>
          </div>
        </div>

        {/* Score area */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted ? (
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Result</span>
                <span className="font-black text-white tabular-nums">
                  {match.home_score}–{match.away_score}
                </span>
              </div>
              {hasPrediction && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">You</span>
                  <span className={`font-bold text-sm tabular-nums ${
                    points?.is_exact_score ? 'text-emerald-400' :
                    points?.points_awarded === 1 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {prediction!.home}–{prediction!.away}
                  </span>
                </div>
              )}
              {!hasPrediction && (
                <div className="text-xs text-gray-600 italic">No prediction</div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" max="20"
                value={prediction?.home ?? ''}
                onChange={e => onHomeChange(e.target.value)}
                disabled={isLocked}
                className="score-input"
                placeholder="0"
              />
              <span className="text-gray-600 font-bold text-sm">–</span>
              <input
                type="number" min="0" max="20"
                value={prediction?.away ?? ''}
                onChange={e => onAwayChange(e.target.value)}
                disabled={isLocked}
                className="score-input"
                placeholder="0"
              />
            </div>
          )}

          {/* Points badge */}
          {isCompleted && points && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
              points.is_exact_score ? 'bg-emerald-500/20 text-emerald-400' :
              points.points_awarded === 1 ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-800 text-gray-500'
            }`}>
              +{points.points_awarded}
            </div>
          )}

          {/* Save button */}
          {!isLocked && !isCompleted && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-orange-500 hover:bg-orange-400 text-white'
              } disabled:opacity-50`}
            >
              {isSaving ? '…' : isSaved ? '✓' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
