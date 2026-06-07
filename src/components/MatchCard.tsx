import { Match, Points } from '@/lib/database.types'
import FlagImg from './FlagImg'

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
  let bgClass = ''
  if (isCompleted && points) {
    if (points.is_exact_score) {
      borderClass = 'border-l-4 border-l-emerald-500'
      bgClass = 'bg-emerald-950/20'
    } else if (points.points_awarded === 1) {
      borderClass = 'border-l-4 border-l-blue-500'
      bgClass = 'bg-blue-950/20'
    } else if (hasPrediction) {
      borderClass = 'border-l-4 border-l-red-600'
      bgClass = 'bg-red-950/10'
    }
  }

  return (
    <div className={`px-4 py-3.5 transition-colors ${borderClass} ${bgClass}`}>
      <div className="flex items-center justify-between gap-3">

        {/* Teams column */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-gray-600 mb-2 tabular-nums">
            {kickoff.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}
            {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Home team */}
          <div className="flex items-center gap-2 mb-1.5">
            <FlagImg team={match.home_team} size={22} />
            <span className="font-semibold text-white text-sm leading-tight">{match.home_team}</span>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2">
            <FlagImg team={match.away_team} size={22} />
            <span className="font-semibold text-white text-sm leading-tight">{match.away_team}</span>
          </div>
        </div>

        {/* Score / inputs column */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted ? (
            /* Completed — show result vs prediction */
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-xs text-gray-500">Result</span>
                <span className="font-black text-white tabular-nums text-base">
                  {match.home_score}–{match.away_score}
                </span>
              </div>
              {hasPrediction ? (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs text-gray-500">You</span>
                  <span className={`font-bold tabular-nums text-sm ${
                    points?.is_exact_score ? 'text-emerald-400' :
                    points?.points_awarded === 1 ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {prediction!.home}–{prediction!.away}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-600 italic text-right">No prediction</div>
              )}
            </div>
          ) : (
            /* Open — score inputs stacked to match team rows */
            <div className="flex flex-col gap-1.5">
              <input
                type="number" min="0" max="20"
                value={prediction?.home ?? ''}
                onChange={e => onHomeChange(e.target.value)}
                disabled={isLocked}
                className="score-input"
                placeholder="–"
              />
              <input
                type="number" min="0" max="20"
                value={prediction?.away ?? ''}
                onChange={e => onAwayChange(e.target.value)}
                disabled={isLocked}
                className="score-input"
                placeholder="–"
              />
            </div>
          )}

          {/* Points badge */}
          {isCompleted && points && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
              points.is_exact_score
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                : points.points_awarded === 1
                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                : 'bg-gray-800/80 text-gray-600'
            }`}>
              +{points.points_awarded}
            </div>
          )}

          {/* Save button */}
          {!isLocked && !isCompleted && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`w-14 h-[84px] rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-orange-500 hover:bg-orange-400 active:scale-95 text-white shadow-lg shadow-orange-500/20'
              } disabled:opacity-40`}
            >
              {isSaving ? '…' : isSaved ? '✓' : 'Save'}
            </button>
          )}

          {/* Locked indicator */}
          {isLocked && !isCompleted && (
            <div className="w-10 h-[84px] flex items-center justify-center text-gray-700 flex-shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-2 pl-1">{error}</p>}
    </div>
  )
}
