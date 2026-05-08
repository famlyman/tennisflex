import { createAdminClient } from '@/utils/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

interface RouteParams {
  id: string
}

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { id: organizationId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()

  // Verify user is coordinator for this org
  const { data: coordinator } = await adminClient
    .from('coordinators')
    .select('*')
    .eq('profile_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!coordinator) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: complaints, error } = await adminClient
    .from('complaints')
    .select(`
      *,
      player:players(profile:profiles(full_name))
    `)
    .eq('organization_id', organizationId)
    .eq('assigned_to_role', 'coordinator')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ complaints })
}
