import { Match, Points } from '@/lib/database.types'

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

  let resultClass = ''
  if (isCompleted && points) {
    if (points.is_exact_score) resultClass = 'border-l-4 border-l-emerald-500'
    else if (points.points_awarded === 1) resultClass = 'border-l-4 border-l-blue-500'
    else if (hasPrediction) resultClass = 'border-l-4 border-l-red-500'
  }

  return (
    <div className={`px-5 py-4 ${resultClass}`}>
      <div className="flex items-center justify-between gap-3">
        {/* Teams + kickoff */}
        <div className="flex-1 min-w-0">
          {match.group && (
            <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">
              Group {match.group}
            </span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-semibold text-white text-sm truncate">{match.home_team}</span>
            <span className="text-gray-600 text-xs flex-shrink-0">vs</span>
            <span className="font-semibold text-white text-sm truncate">{match.away_team}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' · '}
            {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Score area */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted ? (
            /* Show actual result + prediction */
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Result</span>
                <span className="font-black text-white">
                  {match.home_score}–{match.away_score}
                </span>
              </div>
              {hasPrediction && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">You</span>
                  <span className={`font-bold text-sm ${
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
            /* Score inputs */
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="20"
                value={prediction?.home ?? ''}
                onChange={e => onHomeChange(e.target.value)}
                disabled={isLocked}
                className="score-input"
                placeholder="0"
              />
              <span className="text-gray-600 font-bold">–</span>
              <input
                type="number"
                min="0"
                max="20"
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
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
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

      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  )
}
