import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase'

async function createNotification(
  adminClient: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  await adminClient.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link
  })
}

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
  const skill_level_id = formData.get('skill_level_id') as string
  const organization_id = formData.get('organization_id') as string
  const ntrp_singles = parseFloat(formData.get('ntrp_singles') as string)
  const ntrp_doubles = parseFloat(formData.get('ntrp_doubles') as string)

  // Get user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check if already registered
  const { data: existingPlayer } = await adminClient
    .from('players')
    .select('id, initial_ntrp_singles, initial_ntrp_doubles')
    .eq('profile_id', profile.id)
    .eq('organization_id', organization_id)
    .single()

  let playerId: string

  if (existingPlayer) {
    // Existing player - update ratings if different and use existing record
    playerId = existingPlayer.id
    
    // Update ratings if the user submitted new ones
    if (ntrp_singles !== existingPlayer.initial_ntrp_singles || ntrp_doubles !== existingPlayer.initial_ntrp_doubles) {
      const tfr_singles = ntrp_singles * 10
      const tfr_doubles = ntrp_doubles * 10
      
      await adminClient
        .from('players')
        .update({
          initial_ntrp_singles: ntrp_singles,
          initial_ntrp_doubles: ntrp_doubles,
          tfr_singles,
          tfr_doubles
        })
        .eq('id', playerId)
    }
  } else {
    // New player - create record
    const tfr_singles = ntrp_singles * 10
    const tfr_doubles = ntrp_doubles * 10

    const { data: newPlayer, error } = await adminClient.from('players').insert({
      profile_id: profile.id,
      organization_id,
      initial_ntrp_singles: ntrp_singles,
      initial_ntrp_doubles: ntrp_doubles,
      tfr_singles,
      tfr_doubles,
      rating_deviation: 4.0,
      match_count_singles: 0,
      match_count_doubles: 0,
      flag_count: 0
    }).select('id').single()

    if (error) {
      console.error('Error registering:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    playerId = newPlayer.id
  }

  // Get season and division info for notifications
  const { data: season } = await adminClient
    .from('seasons')
    .select('name, organization_id')
    .eq('id', seasonId)
    .single()

  // Create season registration record
  const { error: regError } = await adminClient.from('season_registrations').upsert({
    player_id: playerId,
    season_id: seasonId,
    division_id,
    skill_level_id,
    status: 'active'
  }, { onConflict: 'player_id,season_id' })

  if (regError) {
    console.error('Error creating season registration:', regError)
  }

  // Create notification for player
  await createNotification(
    adminClient,
    session.user.id,
    'season_registration',
    `Registered for ${season?.name || 'Season'}`,
    `You have registered for ${season?.name || 'the season'}. Check back for match scheduling!`,
    `/seasons/${seasonId}`
  )

  // Notify coordinators of new registration
  const { data: coordinators } = await adminClient
    .from('coordinators')
    .select('profile_id')
    .eq('organization_id', organization_id)

  for (const coord of coordinators || []) {
    await createNotification(
      adminClient,
      coord.profile_id,
      'new_registration',
      'New Player Registration',
      `${profile.full_name} has registered for ${season?.name || 'the season'}`,
      `/seasons/${seasonId}`
    )
  }

  redirect('/dashboard')
}