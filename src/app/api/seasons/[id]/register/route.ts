import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase'
import { NextResponse } from 'next/server'

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
        getAll() { return cookieStore.getAll() },
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Handle JSON body (new format with partners)
  let body: { organization_id: string; division_ids: string[]; partners?: Record<string, { type: string; playerId?: string; email?: string }> }
  const contentType = request.headers.get('content-type')
  
  if (contentType?.includes('application/json')) {
    body = await request.json()
  } else {
    // Fall back to formData
    const formData = await request.formData()
    const divisionIdsAllRaw = formData.getAll('division_ids')
    const divisionIdsRaw = formData.get('division_ids') as string
    const divisionIdsAll = divisionIdsAllRaw.map((v: any) => String(v))
    
    let division_ids: string[]
    if (divisionIdsRaw && divisionIdsRaw.includes(',')) {
      division_ids = divisionIdsRaw.split(',').filter(Boolean)
    } else if (divisionIdsAll.length > 0) {
      division_ids = divisionIdsAll
    } else if (divisionIdsRaw) {
      division_ids = [divisionIdsRaw]
    } else {
      division_ids = []
    }

    body = {
      organization_id: formData.get('organization_id') as string,
      division_ids
    }
  }
  
  const { organization_id, division_ids, partners = {} } = body

  if (!division_ids || division_ids.length === 0) {
    return NextResponse.json({ error: 'No divisions selected' }, { status: 400 })
  }

  if (!organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, full_name')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check for existing player record
  const { data: existingPlayer, error: playerError } = await adminClient
    .from('players')
    .select('id, initial_ntrp_singles, initial_ntrp_doubles')
    .eq('profile_id', profile.id)
    .eq('organization_id', organization_id)
    .maybeSingle()

  if (playerError) {
    console.error('Error finding player:', playerError)
  }

  let playerId: string
  let finalNtrpSingles: number
  let finalNtrpDoubles: number

  if (existingPlayer) {
    playerId = existingPlayer.id
    finalNtrpSingles = existingPlayer.initial_ntrp_singles || 3.5
    finalNtrpDoubles = existingPlayer.initial_ntrp_doubles || existingPlayer.initial_ntrp_singles || 3.5
  } else {
    // New player - need at least one rating, use profile ratings
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('initial_ntrp_singles, initial_ntrp_doubles')
      .eq('id', profile.id)
      .maybeSingle()
    
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    playerId = newPlayer.id
  }

  // Get season info
  const { data: season } = await adminClient
    .from('seasons')
    .select('name')
    .eq('id', seasonId)
    .maybeSingle()

  // Get divisions info to find skill_level_id for each
  const { data: divisions, error: divError } = await adminClient
    .from('divisions')
    .select('id, type, skill_levels(id, min_rating, max_rating)')
    .in('id', division_ids)

  if (divError) {
    return NextResponse.json({ error: 'Failed to fetch divisions' }, { status: 500 })
  }

  if (!divisions || divisions.length === 0) {
    return NextResponse.json({ error: 'Invalid divisions selected' }, { status: 400 })
  }

  // Create registration for each division
  const registrations = []
  
  for (const divisionId of division_ids) {
    // Find the division and its matching skill level for this player's rating
    const division = divisions?.find(d => d.id === divisionId)
    if (!division) {
      console.log('Division not found:', divisionId)
      continue
    }
    
    const isSingles = division.type.includes('singles')
    const playerRating = isSingles ? finalNtrpSingles : finalNtrpDoubles
    
    // Find matching skill level
    const skillLevel = division.skill_levels?.find((sl: any) => 
      playerRating >= sl.min_rating && playerRating <= sl.max_rating
    )
    
    // Check if already exists first
    const { data: existingReg } = await adminClient
      .from('season_registrations')
      .select('id')
      .eq('player_id', playerId)
      .eq('season_id', seasonId)
      .eq('division_id', divisionId)
      .maybeSingle()

    if (existingReg) {
      continue
    }

    // Handle partner for doubles divisions
    let partner_id = null
    let partner_email = null
    let partner_status = 'none'
    
    const partnerInfo = partners[divisionId]
    if (partnerInfo && division.type.includes('doubles')) {
      if (partnerInfo.type === 'existing' && partnerInfo.playerId) {
        partner_id = partnerInfo.playerId
        partner_status = 'confirmed'
      } else if (partnerInfo.type === 'invite' && partnerInfo.email) {
        partner_email = partnerInfo.email
        partner_status = 'invited'
      }
    }

    // Insert new registration
    const { data: regRecord, error: regError } = await adminClient
      .from('season_registrations')
      .insert({
        player_id: playerId,
        profile_id: profile.id,
        season_id: seasonId,
        division_id: divisionId,
        skill_level_id: skillLevel?.id || null,
        status: 'active',
        partner_id,
        partner_email,
        partner_status
      })
      .select()
      .single()

    if (regError) {
      continue
    }

    registrations.push(division.type)
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