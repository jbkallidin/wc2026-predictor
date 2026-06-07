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

  const hasPrediction =
    prediction?.home !== undefined && prediction?.away !== undefined &&
    prediction.home !== '' && prediction.away !== ''

  // Outcome metadata for completed matches
  const outcome = isCompleted && points
    ? points.is_exact_score
      ? { label: 'Exact score!', color: 'emerald', pts: 3 }
      : points.points_awarded === 1
      ? { label: 'Correct result', color: 'blue', pts: 1 }
      : hasPrediction
      ? { label: 'Wrong result', color: 'red', pts: 0 }
      : { label: 'No prediction', color: 'gray', pts: 0 }
    : null

  const outcomeStyles: Record<string, string> = {
    emerald: 'bg-emerald-950/60 border-emerald-700/40 text-emerald-400',
    blue:    'bg-blue-950/60 border-blue-700/40 text-blue-400',
    red:     'bg-red-950/50 border-red-800/40 text-red-400',
    gray:    'bg-gray-800/40 border-gray-700/30 text-gray-500',
  }

  const leftBorder: Record<string, string> = {
    emerald: 'border-l-4 border-l-emerald-500',
    blue:    'border-l-4 border-l-blue-500',
    red:     'border-l-4 border-l-red-600',
    gray:    '',
  }

  return (
    <div className={`px-4 py-4 transition-colors ${outcome ? leftBorder[outcome.color] : ''}`}>

      {/* Kickoff time */}
      <div className="text-[11px] text-gray-600 mb-2.5 tabular-nums">
        {kickoff.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        {' · '}
        {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-3">

        {/* Teams column */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <FlagImg team={match.home_team} size={20} />
            <span className="font-semibold text-white text-sm leading-tight">{match.home_team}</span>
          </div>
          <div className="flex items-center gap-2">
            <FlagImg team={match.away_team} size={20} />
            <span className="font-semibold text-white text-sm leading-tight">{match.away_team}</span>
          </div>
        </div>

        {/* Score area */}
        {isCompleted ? (
          /* ── COMPLETED: side-by-side scores ── */
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Your prediction */}
            <div className="text-center">
              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Your pick
              </div>
              {hasPrediction ? (
                <div className={`text-xl font-black tabular-nums leading-none ${
                  outcome?.color === 'emerald' ? 'text-emerald-400' :
                  outcome?.color === 'blue'    ? 'text-blue-400' :
                  outcome?.color === 'red'     ? 'text-red-400' :
                  'text-gray-500'
                }`}>
                  {prediction!.home}–{prediction!.away}
                </div>
              ) : (
                <div className="text-sm text-gray-600 italic">–</div>
              )}
            </div>

            {/* Divider arrow */}
            <div className="text-gray-700 text-sm">→</div>

            {/* Actual result */}
            <div className="text-center">
              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Result
              </div>
              <div className="text-xl font-black text-white tabular-nums leading-none">
                {match.home_score}–{match.away_score}
              </div>
            </div>

            {/* Points badge */}
            {points && (
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${
                outcomeStyles[outcome?.color ?? 'gray']
              }`}>
                <span className="text-lg font-black leading-none">
                  {points.points_awarded > 0 ? `+${points.points_awarded}` : '0'}
                </span>
                <span className="text-[9px] opacity-60 font-semibold leading-none mt-0.5">pts</span>
              </div>
            )}
          </div>

        ) : (
          /* ── OPEN/LOCKED: score inputs ── */
          <div className="flex items-center gap-2 flex-shrink-0">
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

            {/* Save button */}
            {!isLocked && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`w-14 h-[84px] rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'text-white shadow-lg shadow-orange-500/20 active:scale-95'
                } disabled:opacity-40`}
                style={!isSaved ? { background: 'linear-gradient(135deg, #FF6B00, #FF8C00)' } : {}}
              >
                {isSaving ? '…' : isSaved ? '✓' : 'Save'}
              </button>
            )}

            {/* Locked icon */}
            {isLocked && (
              <div className="w-10 h-[84px] flex items-center justify-center text-gray-700 flex-shrink-0">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outcome banner — shown for completed matches */}
      {isCompleted && outcome && (
        <div className={`mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-semibold ${
          outcomeStyles[outcome.color]
        }`}>
          <span>
            {outcome.color === 'emerald' && '⭐ '}
            {outcome.color === 'blue'    && '✓ '}
            {outcome.color === 'red'     && '✗ '}
            {outcome.label}
          </span>
          <span className="opacity-70">
            {outcome.pts === 3 && '3 points'}
            {outcome.pts === 1 && '1 point'}
            {outcome.pts === 0 && '0 points'}
          </span>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2 pl-1">{error}</p>}
    </div>
  )
}
