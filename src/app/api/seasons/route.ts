import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
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
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is a coordinator of the organization
  const formData = await request.formData()
  const action = formData.get('action')

  if (action === 'create') {
    const organization_id = formData.get('organization_id') as string
    const name = formData.get('name') as string
    const registration_start = formData.get('registration_start') as string
    const registration_end = formData.get('registration_end') as string
    const season_start = formData.get('season_start') as string
    const season_end = formData.get('season_end') as string

    // Verify coordinator status
    const { data: coordinator } = await supabase
      .from('coordinators')
      .select('*')
      .eq('profile_id', session.user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!coordinator) {
      return Response.json({ error: 'Not a coordinator of this organization' }, { status: 403 })
    }

    const { error } = await supabase.from('seasons').insert({
      organization_id,
      name,
      registration_start: new Date(registration_start).toISOString(),
      registration_end: new Date(registration_end).toISOString(),
      season_start: new Date(season_start).toISOString(),
      season_end: new Date(season_end).toISOString(),
      status: 'upcoming',
      points_config: { win: 3, loss: 0, forfeit: -1, default_win: 2 }
    })

    if (error) {
      console.error('Error creating season:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    redirect('/dashboard')
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}