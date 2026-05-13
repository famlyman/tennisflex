import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data: coordinatorOrgs } = await adminClient
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', user.id)

  if (!coordinatorOrgs || coordinatorOrgs.length === 0) {
    return NextResponse.json({ error: 'Not a coordinator' }, { status: 403 })
  }

  const orgIds = coordinatorOrgs.map(c => c.organization_id)

  // 1. Engagement Metrics: completion rate per season
  const { data: seasons } = await adminClient
    .from('seasons')
    .select('id, name, status, created_at')
    .in('organization_id', orgIds)
    .order('created_at', { ascending: true })

  const engagementSeasons: {
    id: string
    name: string
    status: string
    totalMatches: number
    completedMatches: number
    pendingMatches: number
    completionRate: number
  }[] = []

  let totalAllMatches = 0
  let totalAllCompleted = 0

  for (const season of seasons || []) {
    const { data: divisions } = await adminClient
      .from('divisions')
      .select('id')
      .eq('season_id', season.id)

    const divisionIds = (divisions || []).map(d => d.id)
    if (divisionIds.length === 0) continue

    const { data: skillLevels } = await adminClient
      .from('skill_levels')
      .select('id')
      .in('division_id', divisionIds)

    const skillLevelIds = (skillLevels || []).map(s => s.id)
    if (skillLevelIds.length === 0) continue

    const { count: totalMatches } = await adminClient
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .in('skill_level_id', skillLevelIds)

    const { count: completedMatches } = await adminClient
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .in('skill_level_id', skillLevelIds)
      .eq('status', 'completed')

    const total = totalMatches || 0
    const completed = completedMatches || 0
    totalAllMatches += total
    totalAllCompleted += completed

    engagementSeasons.push({
      id: season.id,
      name: season.name,
      status: season.status,
      totalMatches: total,
      completedMatches: completed,
      pendingMatches: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    })
  }

  // 2. Flagging Heatmap: players with most flags
  const { data: flagData } = await adminClient
    .from('players')
    .select(`
      id,
      tfr_singles,
      tfr_doubles,
      flag_count,
      profile:profiles!players_profile_id_fkey(full_name)
    `)
    .in('organization_id', orgIds)
    .gt('flag_count', 0)
    .order('flag_count', { ascending: false })
    .limit(20)

  type FlaggedPlayerRow = { id: string; tfr_singles: number; tfr_doubles: number; flag_count: number; profile?: { full_name?: string } }
  const flaggedPlayers = (flagData as unknown as FlaggedPlayerRow[] || []).map(p => ({
    playerId: p.id,
    playerName: p.profile?.full_name || 'Unknown',
    flagCount: p.flag_count,
    tfrSingles: Math.round(p.tfr_singles),
    tfrDoubles: Math.round(p.tfr_doubles),
  }))

  // 3. Growth Tracking: registration counts per season
  const growthSeasons: {
    seasonId: string
    seasonName: string
    registrationCount: number
    startDate: string
    status: string
  }[] = []

  for (const season of seasons || []) {
    const { count } = await adminClient
      .from('season_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('season_id', season.id)

    growthSeasons.push({
      seasonId: season.id,
      seasonName: season.name,
      registrationCount: count || 0,
      startDate: season.created_at,
      status: season.status,
    })
  }

  return NextResponse.json({
    engagement: {
      seasons: engagementSeasons,
      overallRate: totalAllMatches > 0 ? Math.round((totalAllCompleted / totalAllMatches) * 100) : 0,
      totalAllMatches,
      totalAllCompleted,
    },
    flags: flaggedPlayers,
    growth: growthSeasons,
  })
}
