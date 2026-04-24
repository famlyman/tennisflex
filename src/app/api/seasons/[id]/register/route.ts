import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
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

  // Use admin client to bypass RLS on players table
  const adminClient = createAdminClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const division_id = formData.get('division_id') as string
  const organization_id = formData.get('organization_id') as string
  const ntrp_singles = parseFloat(formData.get('ntrp_singles') as string)
  const ntrp_doubles = parseFloat(formData.get('ntrp_doubles') as string)

  // Get user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check if already registered
  const { data: existingPlayer } = await adminClient
    .from('players')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('organization_id', organization_id)
    .single()

  if (existingPlayer) {
    return Response.json({ error: 'Already registered for this organization' }, { status: 400 })
  }

  // Calculate initial TFR from NTRP (NTRP * 10 for TFR scale)
  const tfr_singles = ntrp_singles * 10
  const tfr_doubles = ntrp_doubles * 10

  // Create player record with the registration (using admin client)
  const { data: newPlayer, error } = await adminClient.from('players').insert({
    profile_id: profile.id,
    organization_id,
    initial_ntrp_singles: ntrp_singles,
    initial_ntrp_doubles: ntrp_doubles,
    tfr_singles,
    tfr_doubles,
    rating_deviation: 4.0, // Default deviation
    match_count_singles: 0,
    match_count_doubles: 0,
    flag_count: 0
  }).select().single()

  if (error || !newPlayer) {
    console.error('Error registering:', error)
    return Response.json({ error: error?.message || 'Failed to register' }, { status: 500 })
  }

  // Get skill_level_id based on the player's NTRP rating
  const { data: skillLevel } = await adminClient
    .from('skill_levels')
    .select('id, min_rating, max_rating')
    .eq('division_id', division_id)
    .lte('min_rating', ntrp_singles)
    .gte('max_rating', ntrp_singles)
    .single()

  // Create player_season_registration junction record
  const { error: regError } = await adminClient.from('player_season_registrations').insert({
    player_id: newPlayer.id,
    season_id: seasonId,
    division_id,
    skill_level_id: skillLevel?.id || null,
    status: 'active'
  })

  if (regError) {
    console.error('Error creating registration:', regError)
    // Player was created, but junction failed - continue anyway
  }

  redirect('/dashboard')
}