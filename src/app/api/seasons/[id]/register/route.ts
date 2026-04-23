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

  const adminClient = createAdminClient()

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  
  // Handle division_ids - can be comma-separated or multiple
  const divisionIdsRaw = formData.get('division_ids') as string
  console.log('Raw division_ids:', divisionIdsRaw)
  console.log('All form keys:', Array.from(formData.keys()))
  
  const division_ids = divisionIdsRaw 
    ? divisionIdsRaw.split(',').filter(Boolean)
    : formData.getAll('division_ids')
  
  console.log('Parsed division_ids:', division_ids)
  
  const organization_id = formData.get('organization_id') as string
  console.log('organization_id:', organization_id)

  // Early validation
  if (!division_ids || division_ids.length === 0) {
    console.log('No divisions selected, skipping registration')
    return Response.json({ error: 'No divisions selected' }, { status: 400 })
  }

  if (!organization_id) {
    return Response.json({ error: 'Organization not found' }, { status: 400 })
  }

  // Get user's profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check for existing player record
  const { data: existingPlayer } = await adminClient
    .from('players')
    .select('id, initial_ntrp_singles, initial_ntrp_doubles')
    .eq('profile_id', profile.id)
    .eq('organization_id', organization_id)
    .single()

  let playerId: string
  let finalNtrpSingles: number
  let finalNtrpDoubles: number

  if (existingPlayer) {
    playerId = existingPlayer.id
    // Use existing player record ratings
    finalNtrpSingles = existingPlayer.initial_ntrp_singles || 3.5
    finalNtrpDoubles = existingPlayer.initial_ntrp_doubles || existingPlayer.initial_ntrp_singles || 3.5
  } else {
    // New player - need at least one rating, use profile ratings
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('initial_ntrp_singles, initial_ntrp_doubles')
      .eq('id', profile.id)
      .single()
    
    finalNtrpSingles = profileData?.initial_ntrp_singles || 3.5
    finalNtrpDoubles = profileData?.initial_ntrp_doubles || profileData?.initial_ntrp_singles || 3.5
    
    // Create player record
    const tfr_singles = finalNtrpSingles * 10
    const tfr_doubles = finalNtrpDoubles * 10

    const { data: newPlayer, error } = await adminClient.from('players').insert({
      profile_id: profile.id,
      organization_id,
      initial_ntrp_singles: finalNtrpSingles,
      initial_ntrp_doubles: finalNtrpDoubles,
      tfr_singles,
      tfr_doubles,
      rating_deviation: 4.0,
      match_count_singles: 0,
      match_count_doubles: 0,
      flag_count: 0
    }).select('id').single()

    if (error) {
      console.error('Error creating player:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    playerId = newPlayer.id
  }

  // Get season info
  const { data: season } = await adminClient
    .from('seasons')
    .select('name')
    .eq('id', seasonId)
    .single()

  // Get divisions info to find skill_level_id for each
  const { data: divisions } = await adminClient
    .from('divisions')
    .select('id, type, skill_levels(id, min_rating, max_rating)')
    .in('id', division_ids)

  // Create registration for each division
  const registrations = []
  
  for (const divisionId of division_ids) {
    // Find the division and its matching skill level for this player's rating
    const division = divisions?.find(d => d.id === divisionId)
    if (!division) continue
    
    const isSingles = division.type.includes('singles')
    const playerRating = isSingles ? finalNtrpSingles : finalNtrpDoubles
    
    // Find matching skill level
    const skillLevel = division.skill_levels?.find((sl: any) => 
      playerRating >= sl.min_rating && playerRating <= sl.max_rating
    )
    
    // Always create registration (even without skill level match, let coordinator fix it)
    const { error: regError } = await adminClient
      .from('season_registrations')
      .upsert({
        player_id: playerId,
        profile_id: profile.id,
        season_id: seasonId,
        division_id: divisionId,
        skill_level_id: skillLevel?.id || null,
        status: 'active'
      }, { onConflict: 'player_id,season_id,division_id' })

    if (regError) {
      console.error('Registration error:', regError)
    } else {
      registrations.push(division.type)
    }
  }

  // Create notification
  await createNotification(
    adminClient,
    session.user.id,
    'season_registration',
    `Registered for ${season?.name || 'Season'}`,
    `You are registered in ${registrations.length} division(s): ${registrations.join(', ')}`,
    `/seasons/${seasonId}`
  )

  // Notify coordinators
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
      `${profile.full_name} has registered for ${season?.name || 'the season'} (${registrations.length} divisions)`,
      `/seasons/${seasonId}`
    )
  }

  redirect('/dashboard')
}