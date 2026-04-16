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
    
    if (!process.env.SUPABASE_SECRET_KEY) {
      console.error('SUPABASE_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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
    
    const { data: newOrg, error: orgError } = await adminSupabase.from('organizations').insert({
      name: flexName,
      slug,
      region,
    }).select().single()
    
    if (orgError) {
      console.error('Failed to create organization:', orgError)
      return NextResponse.json({ error: `Failed to create organization: ${orgError.message}` }, { status: 500 })
    }

    let emailSent = false
    let userId: string | null = null
    
    try {
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          user_type: 'coordinator'
        }
      })
      
      if (createError) {
        console.error('Failed to create user:', createError.message)
        return NextResponse.json({ error: `Failed to create user: ${createError.message}` }, { status: 500 })
      }
      
      userId = newUser?.user?.id
      
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${new URL(request.url).origin}/set-password`
        }
      })

      if (linkError) {
        console.error('Failed to generate link:', linkError.message)
        return NextResponse.json({ error: `Failed to generate link: ${linkError.message}` }, { status: 500 })
      }
      
      emailSent = true
      console.log(`\n--- Password setup link generated for ${email} ---\n`)
      console.log('Link:', linkData.properties?.action_link)
    } catch (err) {
      console.error('User creation threw:', err)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    if (userId) {
      await adminSupabase.from('coordinators').insert({
        profile_id: userId,
        organization_id: newOrg.id,
        role: 'admin'
      })
    }
    
    if (requestId) {
      await adminSupabase.from('chapter_requests').update({
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
