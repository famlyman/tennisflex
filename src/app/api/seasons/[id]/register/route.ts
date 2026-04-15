import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check if already registered
  const { data: existingPlayer } = await supabase
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

  // Create player record with the registration
  const { error } = await supabase.from('players').insert({
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
  })

  if (error) {
    console.error('Error registering:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Note: Division registration would need another table or could be stored in players table
  // For now, we'll just create the player record

  redirect('/dashboard')
}