import { createClient } from '@/lib/supabase/server'
import { LeaderboardRow } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

const MEDALS = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: rawRows, error } = await supabase.from('leaderboard').select('*')
  const rows = rawRows as LeaderboardRow[] | null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">Ranked by points · exact scores break ties</p>
      </div>

      {/* Top 3 podium */}
      {rows && rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[rows[1], rows[0], rows[2]].map((row, podiumPos) => {
            if (!row) return null
            const actualRank = podiumPos === 0 ? 1 : podiumPos === 1 ? 0 : 2
            const heights = ['h-24', 'h-28', 'h-20']
            const glows = [
              'ring-1 ring-gray-500/30',
              'ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10',
              'ring-1 ring-orange-700/30',
            ]
            return (
              <div
                key={row.id}
                className={`flex flex-col items-center justify-end rounded-2xl border border-white/5 p-3 pb-4 ${heights[actualRank]} ${glows[actualRank]}`}
                style={{
                  background: actualRank === 1
                    ? 'linear-gradient(180deg, rgba(255,215,0,0.08) 0%, rgba(20,20,32,0.8) 100%)'
                    : 'rgba(20,20,32,0.6)',
                }}
              >
                <div className="text-2xl mb-1">{MEDALS[actualRank]}</div>
                <div className="text-white font-bold text-sm text-center leading-tight truncate w-full text-center">
                  {row.display_name}
                </div>
                <div className={`text-xl font-black mt-1 ${actualRank === 1 ? 'gold-gradient' : 'text-white'}`}>
                  {row.total_points}
                  <span className="text-xs font-semibold text-gray-500 ml-1">pts</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: 'rgba(16,16,26,0.8)' }}>

        {/* Header row */}
        <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-3 px-5 py-3 border-b border-white/5">
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">#</span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Player</span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Pts</span>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider text-right">⚽</span>
        </div>

        {error && (
          <div className="px-5 py-6 text-red-400 text-sm">Failed to load leaderboard.</div>
        )}
        {!error && (!rows || rows.length === 0) && (
          <div className="px-5 py-12 text-center text-gray-600 text-sm">
            No scores yet — predictions open now!
          </div>
        )}

        {rows?.map((row, i) => (
          <div
            key={row.id}
            className={`grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-3 px-5 py-4 items-center border-b border-white/5 last:border-0 transition-colors hover:bg-white/3 ${
              i === 0 ? 'bg-amber-500/5' : ''
            }`}
          >
            <span className={`font-black text-sm ${
              i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {i < 3 ? MEDALS[i] : row.rank}
            </span>
            <span className={`font-semibold truncate ${i < 3 ? 'text-white' : 'text-gray-300'}`}>
              {row.display_name}
            </span>
            <span className={`text-right font-black ${i < 3 ? 'text-white' : 'text-gray-400'}`}>
              {row.total_points}
            </span>
            <span className="text-right text-sm text-gray-500 tabular-nums">
              {row.exact_scores}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-700 text-center mt-5">
        1 pt correct result · 3 pts exact score · ⚽ = exact scores (tiebreaker)
      </p>
    </div>
  )
}
