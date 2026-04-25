import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  
  if (!process.env.SUPABASE_SECRET_KEY) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 })
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

  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const action = formData.get('action')

  if (action === 'create') {
    const organization_id = formData.get('organization_id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const registration_start = formData.get('registration_start') as string
    const registration_end = formData.get('registration_end') as string
    const season_start = formData.get('season_start') as string
    const season_end = formData.get('season_end') as string

    // Create the season
    const { data: seasonData, error } = await adminSupabase.from('seasons').insert({
      organization_id,
      name,
      description,
      registration_start: new Date(registration_start).toISOString(),
      registration_end: new Date(registration_end).toISOString(),
      season_start: new Date(season_start).toISOString(),
      season_end: new Date(season_end).toISOString(),
      status: 'upcoming',
      points_config: { win: 3, loss: 0, forfeit: -1, default_win: 2 }
    }).select().single()

    if (error) {
      console.error('Error creating season:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    const seasonId = seasonData.id

    // Seed default divisions
    const defaultDivisions = [
      { name: "Men's Singles", type: 'mens_singles' },
      { name: "Women's Singles", type: 'womens_singles' },
      { name: "Men's Doubles", type: 'mens_doubles' },
      { name: "Women's Doubles", type: 'womens_doubles' },
      { name: "Mixed Doubles", type: 'mixed_doubles' }
    ]

    for (const div of defaultDivisions) {
      const { data: divisionData, error: divError } = await adminSupabase
        .from('divisions')
        .insert({ season_id: seasonId, name: div.name, type: div.type })
        .select()
        .single()

      if (divError) {
        console.error('Error creating division:', divError)
        continue
      }

      // Seed default skill levels (TFR scale: NTRP × 10)
      const skillLevels = [
        { name: '2.5', min_rating: 25, max_rating: 29 },
        { name: '3.0', min_rating: 30, max_rating: 34 },
        { name: '3.5', min_rating: 35, max_rating: 39 },
        { name: '4.0', min_rating: 40, max_rating: 44 },
        { name: '4.5', min_rating: 45, max_rating: 49 },
        { name: '5.0+', min_rating: 50, max_rating: null }
      ]

      for (const level of skillLevels) {
        await adminSupabase.from('skill_levels').insert({
          division_id: divisionData.id,
          name: level.name,
          min_rating: level.min_rating,
          max_rating: level.max_rating
        })
      }
    }

    return Response.json({ success: true, season: seasonData })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
