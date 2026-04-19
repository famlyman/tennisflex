import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  // Get all players with their stats
  const { data: players } = await adminClient
    .from('players')
    .select(`
      id,
      tfr_singles,
      tfr_doubles,
      match_count_singles,
      match_count_doubles,
      wins_singles,
      losses_singles,
      wins_doubles,
      losses_doubles,
      profile:profiles!players_profile_id_fkey (full_name)
    `)
    .order('tfr_singles', { ascending: false })

  // Sort singles leaderboard
  const singlesLeaderboard = (players || [])
    .filter(p => p.match_count_singles > 0)
    .map((p: any, index) => ({
      rank: index + 1,
      name: p.profile?.full_name || 'Unknown',
      rating: p.tfr_singles,
      wins: p.wins_singles || 0,
      losses: p.losses_singles || 0,
      matches: p.match_count_singles,
    }))
    .slice(0, 20)

  // Sort doubles leaderboard
  const doublesLeaderboard = (players || [])
    .filter(p => p.match_count_doubles > 0)
    .map((p: any, index) => ({
      rank: index + 1,
      name: p.profile?.full_name || 'Unknown',
      rating: p.tfr_doubles,
      wins: p.wins_doubles || 0,
      losses: p.losses_doubles || 0,
      matches: p.match_count_doubles,
    }))
    .slice(0, 20)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">T</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Tennis-Flex</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600 mb-4 inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboards</h1>
          <p className="text-slate-600 mt-1">Top players across all Flexes</p>
        </div>

        {/* Singles Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Men's Singles</h2>
            <p className="text-sm text-slate-500">Top 20 by TFR rating</p>
          </div>
          
          {singlesLeaderboard.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No players yet. Join a season to get on the leaderboard!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {singlesLeaderboard.map((player: any) => (
                <div key={player.rank} className="p-4 flex items-center">
                  <div className="w-12 text-lg font-bold text-slate-400">#{player.rank}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{player.name}</p>
                    <p className="text-sm text-slate-500">
                      {player.wins}W - {player.losses}L • {player.matches} matches
                    </p>
                  </div>
                  <div className="text-xl font-bold text-indigo-600">
                    {player.rating?.toFixed(1) || '--'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doubles Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Men's Doubles</h2>
            <p className="text-sm text-slate-500">Top 20 by TFR rating</p>
          </div>
          
          {doublesLeaderboard.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No players yet. Join a season to get on the leaderboard!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {doublesLeaderboard.map((player: any) => (
                <div key={player.rank} className="p-4 flex items-center">
                  <div className="w-12 text-lg font-bold text-slate-400">#{player.rank}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{player.name}</p>
                    <p className="text-sm text-slate-500">
                      {player.wins}W - {player.losses}L • {player.matches} matches
                    </p>
                  </div>
                  <div className="text-xl font-bold text-indigo-600">
                    {player.rating?.toFixed(1) || '--'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}