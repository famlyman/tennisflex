import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'
import MatchHubClient from '@/components/MatchHubClient'

interface MatchPageProps {
  params: Promise<{ id: string }>
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id: matchId } = await params
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const adminClient = createAdminClient()

  // Fetch match details with joined data
  const { data: match, error: matchError } = await adminClient
    .from('matches')
    .select(`
      *,
      skill_level:skill_levels!matches_skill_level_id_fkey (
        id, name, 
        division:divisions!skill_levels_division_id_fkey (
          id, name, type, season_id,
          season:seasons!divisions_season_id_fkey (id, name)
        )
      ),
      home_player:players!matches_home_player_id_fkey (
        *, profile:profiles!players_profile_id_fkey (*)
      ),
      away_player:players!matches_away_player_id_fkey (
        *, profile:profiles!players_profile_id_fkey (*)
      )
    `)
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    notFound()
  }

  // Determine if current user is one of the players
  const isHome = match.home_player?.profile_id === user.id
  const isAway = match.away_player?.profile_id === user.id

  if (!isHome && !isAway) {
    // Check if user is a coordinator for this organization
    const { data: coordinator } = await adminClient
      .from('coordinators')
      .select('*')
      .eq('profile_id', user.id)
      .eq('organization_id', match.home_player?.organization_id)
      .maybeSingle()

    if (!coordinator) {
      redirect('/dashboard')
    }
  }

  const currentPlayer = isHome ? match.home_player : match.away_player
  const opponent = isHome ? match.away_player : match.home_player

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Match Header Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">
                    {match.skill_level?.division?.season?.name}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 text-sm font-medium">
                    {match.skill_level?.division?.name}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {isHome ? `vs ${match.away_player?.profile?.full_name}` : `vs ${match.home_player?.profile?.full_name}`}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-sm ${
                match.status === 'completed' 
                  ? 'bg-slate-100 border-slate-200 text-slate-600'
                  : match.scheduled_at 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                {match.status === 'completed' 
                  ? 'Completed' 
                  : match.scheduled_at 
                    ? `Scheduled: ${new Date(match.scheduled_at).toLocaleDateString()}` 
                    : 'Awaiting Schedule'}
                
                {match.status === 'completed' && match.verified_by_opponent && (
                  <span className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] uppercase tracking-wider rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.172a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <MatchHubClient 
          match={match} 
          currentUserId={user.id} 
          currentPlayerId={currentPlayer?.id}
          opponent={opponent}
        />
      </main>
    </div>
  )
}
