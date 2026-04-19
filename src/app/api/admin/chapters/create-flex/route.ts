import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSetPasswordToken } from '@/utils/token'

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

    let userId: string | null = null
    const baseUrl = new URL(request.url).origin
    
    // Step 1: Invite user (this ALWAYS sends an email)
    try {
      const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            user_type: 'coordinator'
          }
        }
      )
      
      if (inviteError) {
        console.error('Failed to invite user:', inviteError.message)
        return NextResponse.json({ error: `Failed to invite user: ${inviteError.message}` }, { status: 500 })
      }
      
      userId = inviteData.user?.id
      console.log(`\n--- Invite sent to ${email} ---\n`)
    } catch (err) {
      console.error('Invite threw:', err)
      return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 })
    }
    
    // Step 2: Create coordinator link
    if (userId) {
      await adminSupabase.from('coordinators').insert({
        profile_id: userId,
        organization_id: newOrg.id,
        role: 'admin'
      })
    }
    
    // Step 3: Generate signed token for password setup (for manual fallback)
    if (userId) {
      const token = await createSetPasswordToken({
        userId,
        email,
        purpose: 'set-password',
        organizationId: newOrg.id
      })
      
      console.log('\n--- SET PASSWORD LINK (FALLBACK) ---')
      console.log('If email not received, use this link:')
      console.log(`${baseUrl}/set-password?token=${token}`)
      console.log('-------------------------------------\n')
    }
    
    // Step 4: Update chapter request if applicable
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
      message: 'Flex created! Invitation email sent.'
    })
    
  } catch (error) {
    console.error('Create Flex error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}