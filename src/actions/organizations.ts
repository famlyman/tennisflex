// Server action to fetch organizations (Flexes) - Server Component only
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getOrganizations() {
  'use server'
  
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
    .from('organizations')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data || []
}

// Get organizations based on user's location
export async function getOrganizationsByLocation(userId: string) {
  'use server'
  
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

  // Get user's profile to check location
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // If user has a location set, filter by it
  if (profile?.region) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .ilike('region', `%${profile.region}%`)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching organizations:', error)
      return []
    }
    return data || []
  }

  // Otherwise return all organizations
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data || []
}

// Get seasons for user's organizations
export async function getSeasonsForUser(userId: string) {
  'use server'
  
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

  // Get all organizations where user is coordinator (most likely case)
  const { data: coordinatorOrgs } = await supabase
    .from('coordinators')
    .select('organization_id')
    .eq('profile_id', userId)

  // Also check if they're a player
  const { data: playerOrgs } = await supabase
    .from('players')
    .select('organization_id')
    .eq('profile_id', userId)

  // Combine unique org IDs
  const orgIdSet = new Set([
    ...(coordinatorOrgs?.map(c => c.organization_id) || []),
    ...(playerOrgs?.map(p => p.organization_id) || [])
  ])
  const orgIds = Array.from(orgIdSet)

  if (orgIds.length === 0) {
    console.log('No org IDs found for user:', userId)
    return []
  }

  console.log('Fetching seasons for orgs:', orgIds)

  // Get seasons for these organizations - no status filter to see everything
  const { data, error } = await supabase
    .from('seasons')
    .select(`
      *,
      organization:organizations!seasons_organization_id_fkey (
        id,
        name,
        slug,
        region
      )
    `)
    .in('organization_id', orgIds)
    // .in('status', ['registration_open', 'upcoming', 'active'])  // Removing filter to debug
    .order('registration_start', { ascending: true })

  if (error) {
    console.error('Error fetching seasons:', error)
    return []
  }

  console.log('Seasons data returned:', data?.length)
  return data || []
}

// Get a single organization by slug
export async function getOrganizationBySlug(slug: string) {
  'use server'
  
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
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data
}

// Get seasons for an organization
export async function getSeasonsByOrganization(organizationId: string) {
  'use server'
  
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
    .order('season_start', { ascending: false })

  if (error) {
    console.error('Error fetching seasons:', error)
    return []
  }

  return data || []
}

// Get current user's profile
export async function getCurrentProfile() {
  'use server'
  
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
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}