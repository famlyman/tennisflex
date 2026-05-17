import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase'

type SeasonData = {
  id: string
  name: string
  status: string
  organization_id: string
  organization?: { name: string }
  season_start: string
  season_end: string
}

type ProfileData = {
  id: string
  full_name: string
}

type MatchRow = {
  id: string
  skill_level_id: string
  home_player_id: string
  away_player_id: string
  home_partner_id: string | null
  away_partner_id: string | null
  status: string
  score: string | null
  winner_id: string | null
  scheduled_at: string | null
  created_at: string
}

type EnhancedMatch = MatchRow & {
  home_player_name: string
  away_player_name: string
  home_partner_name: string | null
  away_partner_name: string | null
  is_win: boolean
  is_loss: boolean
  display_date: string
}

export default async function SeasonSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Record<string, unknown>)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single<ProfileData>()

  const { data: season } = await adminClient
    .from('seasons')
    .select('*, organization:organizations!seasons_organization_id_fkey (name)')
    .eq('id', seasonId)
    .single<SeasonData>()

  if (!season) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">Season not found</div>
      </div>
    )
  }

  const { data: playerRecords } = await adminClient
    .from('players')
    .select('*')
    .eq('profile_id', user.id)
    .eq('organization_id', season.organization_id)

  const userPlayerIds = (playerRecords || []).map(p => p.id)

  if (userPlayerIds.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar profileName={profile?.full_name} />
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12">
            <div className="text-6xl mb-4">🎾</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Not Registered</h1>
            <p className="text-slate-500 mb-6">You are not registered as a player in this season.</p>
            <Link href={`/seasons/${seasonId}`} className="text-indigo-600 hover:underline font-medium">
              ← Back to Season
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { data: divisions } = await adminClient
    .from('divisions')
    .select('id, name, type')
    .eq('season_id', seasonId)

  const divisionIds = (divisions || []).map(d => d.id)
  const { data: skillLevels } = divisionIds.length > 0
    ? await adminClient.from('skill_levels').select('*').in('division_id', divisionIds)
    : { data: [] }

  const skillLevelIds = (skillLevels || []).map(sl => sl.id)
  const { data: rawMatches } = skillLevelIds.length > 0
    ? await adminClient
        .from('matches')
        .select('*')
        .in('skill_level_id', skillLevelIds)
    : { data: [] }

  const allMatches: MatchRow[] = rawMatches || []

  const myMatches = allMatches.filter(m =>
    userPlayerIds.includes(m.home_player_id) ||
    userPlayerIds.includes(m.away_player_id) ||
    (m.home_partner_id && userPlayerIds.includes(m.home_partner_id)) ||
    (m.away_partner_id && userPlayerIds.includes(m.away_partner_id))
  )

  const allPlayerIds = new Set<string>()
  allMatches.forEach(m => {
    if (m.home_player_id) allPlayerIds.add(m.home_player_id)
    if (m.away_player_id) allPlayerIds.add(m.away_player_id)
    if (m.home_partner_id) allPlayerIds.add(m.home_partner_id)
    if (m.away_partner_id) allPlayerIds.add(m.away_partner_id)
  })

  const { data: playerData } = await adminClient
    .from('players')
    .select('id, profile_id')
    .in('id', Array.from(allPlayerIds))

  const playerToProfile = new Map((playerData || []).map(p => [p.id, p.profile_id]))
  const profileIds = new Set((playerData || []).map(p => p.profile_id).filter(Boolean))

  let profileMap = new Map<string, string | null>()
  if (profileIds.size > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(profileIds))
    profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))
  }

  const enhancedMatches: EnhancedMatch[] = myMatches.map(m => {
    const homePid = playerToProfile.get(m.home_player_id)
    const awayPid = playerToProfile.get(m.away_player_id)
    const homePartnerPid = m.home_partner_id ? playerToProfile.get(m.home_partner_id) : null
    const awayPartnerPid = m.away_partner_id ? playerToProfile.get(m.away_partner_id) : null

    return {
      ...m,
      home_player_name: homePid ? profileMap.get(homePid) || 'Unknown' : 'TBD',
      away_player_name: awayPid ? profileMap.get(awayPid) || 'Unknown' : 'TBD',
      home_partner_name: homePartnerPid ? profileMap.get(homePartnerPid) || 'Unknown' : null,
      away_partner_name: awayPartnerPid ? profileMap.get(awayPartnerPid) || 'Unknown' : null,
      is_win: m.status === 'completed' && userPlayerIds.includes(m.winner_id || ''),
      is_loss: m.status === 'completed' && m.winner_id != null && !userPlayerIds.includes(m.winner_id),
      display_date: m.scheduled_at || m.created_at,
    }
  })

  const completedMatches = enhancedMatches.filter(m => m.status === 'completed')
  const wins = completedMatches.filter(m => m.is_win).length
  const losses = completedMatches.filter(m => m.is_loss).length
  const forfeits = enhancedMatches.filter(m => m.status === 'forfeited').length
  const matchesPlayed = completedMatches.length + forfeits
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0

  const timeline = [...enhancedMatches].sort(
    (a, b) => new Date(a.display_date).getTime() - new Date(b.display_date).getTime()
  )

  let longestWinStreak = 0
  let currentStreak = 0
  let currentStreakType: 'win' | 'loss' | null = null
  for (const m of timeline) {
    if (m.is_win) {
      if (currentStreakType === 'win') currentStreak++
      else { currentStreak = 1; currentStreakType = 'win' }
      longestWinStreak = Math.max(longestWinStreak, currentStreak)
    } else if (m.is_loss) {
      if (currentStreakType === 'loss') currentStreak++
      else { currentStreak = 1; currentStreakType = 'loss' }
    } else {
      currentStreak = 0
      currentStreakType = null
    }
  }

  const hasDoubles = enhancedMatches.some(m => m.home_partner_id || m.away_partner_id)
  const topSkillLevelId = completedMatches.length > 0
    ? completedMatches.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0].skill_level_id
    : skillLevelIds[0]

  let leaderboard: { player_id: string; player_name: string; wins: number; losses: number; matches: number }[] = []
  let playerRank: number | null = null
  let playerEntry: { player_id: string; player_name: string; wins: number; losses: number; matches: number } | null = null

  if (topSkillLevelId) {
    const { data: slMatches } = await adminClient
      .from('matches')
      .select('id, home_player_id, away_player_id, winner_id')
      .eq('skill_level_id', topSkillLevelId)
      .eq('status', 'completed')

    const { data: regs } = await adminClient
      .from('season_registrations')
      .select('player_id')
      .eq('skill_level_id', topSkillLevelId)
      .in('status', ['active', 'completed'])

    const regPlayerIds = new Set((regs || []).map(r => r.player_id))

    const { data: orgPlayers } = await adminClient
      .from('players')
      .select('id, profile:profiles!players_profile_id_fkey(full_name)')
      .eq('organization_id', season.organization_id)

    const eligiblePlayers = (orgPlayers || []).filter(p => regPlayerIds.has(p.id))

    type OrgPlayerRow = { id: string; profile?: { full_name?: string } }
    const rawPlayers = eligiblePlayers as unknown as OrgPlayerRow[]

    const lbData = rawPlayers.map(p => {
      const pMatches = (slMatches || []).filter((m: { home_player_id: string; away_player_id: string }) =>
        m.home_player_id === p.id || m.away_player_id === p.id
      )
      let w = 0, l = 0
      pMatches.forEach((m: { winner_id?: string }) => {
        if (m.winner_id === p.id) w++
        else if (m.winner_id) l++
      })
      return { player_id: p.id, player_name: p.profile?.full_name || 'Unknown', wins: w, losses: l, matches: pMatches.length }
    })

    lbData.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      const aRate = a.matches > 0 ? a.wins / a.matches : 0
      const bRate = b.matches > 0 ? b.wins / b.matches : 0
      if (bRate !== aRate) return bRate - aRate
      return b.matches - a.matches
    })

    leaderboard = lbData.slice(0, 10)
    const rank = lbData.findIndex(e => userPlayerIds.includes(e.player_id))
    playerRank = rank !== -1 ? rank + 1 : null
    playerEntry = rank !== -1 ? lbData[rank] : null
  }

  const achievements: { label: string; description: string; icon: string; achieved: boolean }[] = [
    {
      label: 'Perfect Season',
      description: 'Undefeated',
      icon: '🏆',
      achieved: wins > 0 && losses === 0,
    },
    {
      label: 'Hot Streak',
      description: `${longestWinStreak} consecutive wins`,
      icon: '🔥',
      achieved: longestWinStreak >= 3,
    },
    {
      label: 'Sharpshooter',
      description: `${winRate}% win rate`,
      icon: '🎯',
      achieved: winRate >= 75 && matchesPlayed >= 3,
    },
    {
      label: 'Team Player',
      description: 'Played doubles',
      icon: '🤝',
      achieved: hasDoubles,
    },
    {
      label: 'Season Veteran',
      description: `${matchesPlayed} matches played`,
      icon: '💪',
      achieved: matchesPlayed >= 8,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar profileName={profile?.full_name} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link href={`/seasons/${seasonId}`} className="text-sm text-slate-600 hover:text-indigo-600 mb-6 inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Season
        </Link>

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl shadow-xl border border-slate-700/50 mb-8">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div className="relative p-8 md:p-10">
            <div className="flex items-center gap-2 text-amber-400/80 text-xs font-black uppercase tracking-widest mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Your Season Summary
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">{season.name}</h1>
            <p className="text-slate-400 font-medium">{season.organization?.name}</p>

            {(wins > 0 || losses > 0) && (
              <div className="flex items-center gap-6 mt-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Record</p>
                  <p className={`text-3xl font-black ${wins > 0 && losses === 0 ? 'text-amber-400' : 'text-white'}`}>
                    {wins}-{losses}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-700"></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Win Rate</p>
                  <p className="text-3xl font-black text-white">{winRate}%</p>
                </div>
                <div className="w-px h-10 bg-slate-700"></div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rank</p>
                  <p className="text-3xl font-black text-white">{playerRank ? `#${playerRank}` : '—'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Matches"
            value={matchesPlayed.toString()}
            sub={forfeits > 0 ? `${forfeits} forfeited` : undefined}
            color="slate"
          />
          <StatCard
            label="Wins"
            value={wins.toString()}
            color="emerald"
          />
          <StatCard
            label="Losses"
            value={losses.toString()}
            color="red"
          />
          <StatCard
            label="TFR Rating"
            value={playerRecords && playerRecords.length > 0 ? Math.round(playerRecords[0].tfr_singles).toString() : '—'}
            sub={hasDoubles && playerRecords && playerRecords.length > 0 ? `Doubles: ${Math.round(playerRecords[0].tfr_doubles)}` : undefined}
            color="indigo"
          />
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {achievements.map(a => (
              <div
                key={a.label}
                className={`p-4 rounded-xl text-center border transition-all ${
                  a.achieved
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : 'bg-slate-50 border-slate-100 opacity-40'
                }`}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className={`text-xs font-bold uppercase tracking-wider ${a.achieved ? 'text-slate-900' : 'text-slate-400'}`}>
                  {a.label}
                </p>
                <p className={`text-[10px] mt-0.5 ${a.achieved ? 'text-slate-500' : 'text-slate-300'}`}>
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Match Timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No matches yet this season.</p>
          ) : (
            <div className="space-y-0">
              {timeline.map((match, idx) => {
                const isHome = userPlayerIds.includes(match.home_player_id) ||
                  (match.home_partner_id ? userPlayerIds.includes(match.home_partner_id) : false)

                const playerSide = isHome
                  ? [match.home_player_name, match.home_partner_name].filter(Boolean)
                  : [match.away_player_name, match.away_partner_name].filter(Boolean)
                const opponentSide = isHome
                  ? [match.away_player_name, match.away_partner_name].filter(Boolean)
                  : [match.home_player_name, match.home_partner_name].filter(Boolean)

                const isPending = match.status !== 'completed' && match.status !== 'forfeited'

                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center gap-4 py-4 group hover:bg-slate-50 px-4 -mx-4 rounded-xl transition-colors"
                  >
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        match.is_win ? 'bg-emerald-500 border-emerald-500' :
                        match.is_loss ? 'bg-red-500 border-red-500' :
                        isPending ? 'bg-slate-200 border-slate-300' :
                        'bg-slate-300 border-slate-300'
                      }`} />
                      {idx < timeline.length - 1 && (
                        <div className="w-px h-full min-h-[3rem] bg-slate-200" />
                      )}
                    </div>

                    {/* Result badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      match.is_win ? 'bg-emerald-100 text-emerald-700' :
                      match.is_loss ? 'bg-red-100 text-red-700' :
                      isPending ? 'bg-slate-100 text-slate-500' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {match.is_win ? 'W' : match.is_loss ? 'L' : match.status === 'forfeited' ? 'F' : '—'}
                    </div>

                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {playerSide.join(' & ')} vs {opponentSide.join(' & ')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{new Date(match.display_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        {match.score && <><span className="text-slate-300">&#x2022;</span><span className="font-medium text-slate-700">{match.score}</span></>}
                        {isPending && <><span className="text-slate-300">&#x2022;</span><span className="text-amber-600 font-medium">Pending</span></>}
                        {match.status === 'forfeited' && <><span className="text-slate-300">&#x2022;</span><span className="text-slate-500">Forfeited</span></>}
                      </div>
                    </div>

                    <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Leaderboard Snapshot */}
        {playerEntry && leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Standings</h2>
            <div className="space-y-1">
              {leaderboard.map((entry, i) => {
                const isMe = userPlayerIds.includes(entry.player_id)
                return (
                  <div
                    key={entry.player_id}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                      isMe ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-6 text-center text-sm font-bold ${
                      isMe ? 'text-indigo-700' : i < 3 ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-indigo-700 font-bold' : 'text-slate-900'}`}>
                      {entry.player_name}
                      {isMe && <span className="ml-2 text-[10px] text-indigo-500 uppercase tracking-wider">You</span>}
                    </span>
                    <span className="text-sm text-slate-500 tabular-nums">
                      {entry.wins}-{entry.losses}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-4">
          <Link
            href={`/seasons/${seasonId}`}
            className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-center"
          >
            <p className="font-bold text-slate-900">Full Season View</p>
            <p className="text-xs text-slate-500">Divisions, skill levels, all matches</p>
          </Link>
          <Link
            href={`/seasons/${seasonId}/skill-level/${topSkillLevelId || ''}`}
            className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-center"
          >
            <p className="font-bold text-slate-900">Skill Level Detail</p>
            <p className="text-xs text-slate-500">Your division matches and players</p>
          </Link>
        </div>
      </main>
    </div>
  )
}

function NavBar({ profileName }: { profileName?: string }) {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">T</span>
          </div>
          <span className="font-bold text-xl text-gray-600 tracking-tight">Tennis-Flex</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-indigo-600">Dashboard</Link>
          {profileName && <span className="text-sm text-slate-600">{profileName}</span>}
        </div>
      </div>
    </nav>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: 'slate' | 'emerald' | 'red' | 'indigo' }) {
  const colorMap = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-900', accent: 'bg-slate-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'bg-emerald-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', accent: 'bg-red-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', accent: 'bg-indigo-100' },
  }
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl p-4 border border-slate-100`}>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
