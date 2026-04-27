import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check user is a coordinator of this season's organization
    const { data: season } = await adminClient
      .from('seasons')
      .select('organization_id, status')
      .eq('id', id)
      .single()

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const { data: coordinator } = await adminClient
      .from('coordinators')
      .select('id')
      .eq('profile_id', user.id)
      .eq('organization_id', season.organization_id)
      .single()

    if (!coordinator) {
      return NextResponse.json({ error: 'Not a coordinator of this season' }, { status: 403 })
    }

    // Update season status to active (registration closed)
    const { error: updateError } = await adminClient
      .from('seasons')
      .update({ status: 'active' })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, redirectUrl: `/seasons/${id}` })
  } catch (error) {
    console.error('Error closing registration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
