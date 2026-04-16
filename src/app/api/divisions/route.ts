import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: coordinatorOrgs } = await supabase
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', user.id)

  const orgIds = coordinatorOrgs?.map(c => c.organization_id) || []
  
  if (orgIds.length === 0) {
    return NextResponse.json({ error: 'Not a coordinator' }, { status: 403 })
  }

  const { data: seasons } = await supabase
    .from('seasons')
    .select(`
      *,
      organization:organizations!seasons_organization_id_fkey (id, name, slug),
      divisions (
        *,
        skill_levels (*)
      )
    `)
    .in('organization_id', orgIds)
    .order('season_start', { ascending: false })

  return NextResponse.json(seasons || [])
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  
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
          }
        },
      },
    }
  )

  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SECRET_KEY,
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
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const action = formData.get('action')

  if (action === 'create_division') {
    const season_id = formData.get('season_id') as string
    const name = formData.get('name') as string
    const type = formData.get('type') as string

    const { data: division, error } = await adminSupabase
      .from('divisions')
      .insert({ season_id, name, type })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(division)
  }

  if (action === 'create_skill_level') {
    const division_id = formData.get('division_id') as string
    const name = formData.get('name') as string
    const min_rating = formData.get('min_rating') ? parseFloat(formData.get('min_rating') as string) : null
    const max_rating = formData.get('max_rating') ? parseFloat(formData.get('max_rating') as string) : null

    const { data: skillLevel, error } = await adminSupabase
      .from('skill_levels')
      .insert({ division_id, name, min_rating, max_rating })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(skillLevel)
  }

  if (action === 'delete_division') {
    const division_id = formData.get('division_id') as string

    const { error } = await adminSupabase
      .from('divisions')
      .delete()
      .eq('id', division_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'delete_skill_level') {
    const skill_level_id = formData.get('skill_level_id') as string

    const { error } = await adminSupabase
      .from('skill_levels')
      .delete()
      .eq('id', skill_level_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
