// Server actions for seasons
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createSeason(formData: FormData) {
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
            // Called outside of request context
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const organization_id = formData.get('organization_id') as string
  const registration_start = formData.get('registration_start') as string
  const registration_end = formData.get('registration_end') as string
  const season_start = formData.get('season_start') as string
  const season_end = formData.get('season_end') as string

  const { error } = await supabase.from('seasons').insert({
    name,
    organization_id,
    registration_start: new Date(registration_start).toISOString(),
    registration_end: new Date(registration_end).toISOString(),
    season_start: new Date(season_start).toISOString(),
    season_end: new Date(season_end).toISOString(),
    status: 'upcoming',
    points_config: { win: 3, loss: 0, forfeit: -1, default_win: 2 }
  })

  if (error) {
    console.error('Error creating season:', error)
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function getOrganizationsForUser(userId: string) {
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
            // Called outside of request context
          }
        },
      },
    }
  )

  // Get organizations where user is a coordinator
  const { data, error } = await supabase
    .from('coordinators')
    .select(`
      organization:organizations!coordinators_organization_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq('profile_id', userId)

  if (error) {
    console.error('Error fetching coordinator organizations:', error)
    return []
  }

  // Flatten the result
  return data?.map(d => d.organization).filter(Boolean) || []
}

export async function getSeasonsByOrganizationId(organizationId: string) {
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
            // Called outside of request context
          }
        },
      },
    }
  )

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching seasons:', error)
    return []
  }

  return data || []
}