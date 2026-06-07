import { createClient } from '@/lib/supabase/server'
import { LeaderboardRow } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = createClient()

  const { data: rawRows, error } = await supabase
    .from('leaderboard')
    .select('*')

  const rows = rawRows as LeaderboardRow[] | null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">Ranked by points · exact scores break ties</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-3 px-5 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Pts</span>
          <span className="text-right">Exact</span>
        </div>

        {error && (
          <div className="px-5 py-6 text-red-400 text-sm">Failed to load leaderboard.</div>
        )}

        {!error && (!rows || rows.length === 0) && (
          <div className="px-5 py-10 text-center text-gray-600">
            No scores yet. Predictions open now!
          </div>
        )}

        {rows?.map((row, i) => (
          <div
            key={row.id}
            className={`grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-3 px-5 py-4 items-center border-b border-gray-800/50 last:border-0 ${
              i === 0 ? 'bg-amber-500/5' : ''
            }`}
          >
            <span className={`font-black text-sm ${
              i === 0 ? 'text-amber-400' :
              i === 1 ? 'text-gray-400' :
              i === 2 ? 'text-orange-700' :
              'text-gray-600'
            }`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : row.rank}
            </span>
            <span className={`font-semibold ${i < 3 ? 'text-white' : 'text-gray-300'}`}>
              {row.display_name}
            </span>
            <span className={`text-right font-black ${i < 3 ? 'text-white' : 'text-gray-400'}`}>
              {row.total_points}
            </span>
            <span className="text-right text-sm text-gray-500">
              {row.exact_scores}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-700 text-center mt-4">
        1 pt correct result · 3 pts exact score · exact scores break ties
      </p>
    </div>
  )
}
