import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const requestId = formData.get('request_id') as string
    const flexName = formData.get('chapter_name') as string
    const region = formData.get('region') as string
    const email = formData.get('email') as string
    const fullName = formData.get('full_name') as string
    
    if (!flexName || !region || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
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
            }
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'platform_owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const slugPart = flexName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const slug = `tennis-flex-${slugPart}`
    
    const { data: newOrg, error: orgError } = await supabase.from('organizations').insert({
      name: flexName,
      slug,
      region,
    }).select().single()
    
    if (orgError) {
      console.error('Failed to create organization:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }
    
    if (!process.env.SUPABASE_SECRET_KEY) {
      console.error('SUPABASE_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SECRET_KEY,
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

    let userId: string | null = null
    
    try {
      const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          user_type: 'coordinator'
        }
      })
      
      if (userError) {
        console.error('Failed to create user:', userError.message)
      } else {
        userId = newUser?.user?.id
      }
    } catch (err) {
      console.error('Admin user creation threw:', err)
    }
    
    if (userId) {
      await supabase.from('coordinators').insert({
        profile_id: userId,
        organization_id: newOrg.id,
        role: 'admin'
      })
    }

    let emailSent = false
    
    try {
      const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            user_type: 'coordinator'
          },
          redirectTo: `${new URL(request.url).origin}/set-password`
        }
      )

      if (inviteError) {
        console.error('Failed to send invitation:', inviteError.message)
      } else {
        emailSent = true
        console.log(`\n--- Invitation sent to ${email} ---\n`)
        console.log('User ID:', inviteData.user?.id)
      }
    } catch (err) {
      console.error('Invitation threw:', err)
    }
    
    if (requestId) {
      await supabase.from('chapter_requests').update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId)
    }

    return NextResponse.json({ 
      success: true, 
      organization: newOrg,
      emailSent,
      message: emailSent 
        ? 'Flex created and invitation email sent!' 
        : 'Flex created but invitation email failed. Check server logs.'
    })
    
  } catch (error) {
    console.error('Create Flex error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
