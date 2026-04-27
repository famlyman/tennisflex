import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const adminClient = createAdminClient()
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Record<string, unknown>)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is a coordinator
  const { data: coordinatorOrgs } = await adminClient
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', user.id)

  if (coordinatorOrgs && coordinatorOrgs.length > 0) {
    const orgIds = coordinatorOrgs.map(c => c.organization_id)
    const { data: seasons } = await adminClient
      .from('seasons')
      .select(`
        id,
        name,
        organization:organizations!seasons_organization_id_fkey (name)
      `)
      .in('organization_id', orgIds)
      .in('status', ['active', 'registration_open'])
      .order('name', { ascending: true })

    return NextResponse.json({ seasons: seasons || [] })
  }

  // Player - get their organization and show only active seasons for that org
  const { data: playerData } = await adminClient
    .from('players')
    .select('organization_id')
    .eq('profile_id', user.id)
    .single()

  if (playerData) {
    const { data: seasons } = await adminClient
      .from('seasons')
      .select(`
        id,
        name,
        organization:organizations!seasons_organization_id_fkey (name)
      `)
      .eq('organization_id', playerData.organization_id)
      .eq('status', 'active')
      .order('name', { ascending: true })

    return NextResponse.json({ seasons: seasons || [] })
  }

  return NextResponse.json({ seasons: [] })
}