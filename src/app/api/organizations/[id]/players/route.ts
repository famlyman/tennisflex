import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params
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

  // Get all players in this organization
  const { data: players } = await adminClient
    .from('players')
    .select('id, profile_id, initial_ntrp_singles, initial_ntrp_doubles')
    .eq('organization_id', organizationId)
    .neq('profile_id', user.id) // Exclude current user

  // Get profile names and gender
  const profileIds = players?.map(p => p.profile_id).filter(Boolean) || []
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, gender')
    .in('id', profileIds)

  const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, gender: p.gender }]) || [])

  const playersWithDetails = players?.map(p => {
    const profile = profileMap.get(p.profile_id)
    return {
      id: p.id,
      name: profile?.name || 'Unknown',
      gender: profile?.gender || null,
      rating_singles: p.initial_ntrp_singles,
      rating_doubles: p.initial_ntrp_doubles
    }
  }) || []

  return NextResponse.json({ players: playersWithDetails })
}