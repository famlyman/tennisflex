import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createSetPasswordToken } from '@/utils/token'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()
    
    const flexName = formData.get('chapter_name') as string
    const region = formData.get('region') as string
    
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
      return Response.redirect(new URL('/login', request.url), 303)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'platform_owner') {
      return Response.redirect(new URL('/dashboard', request.url), 303)
    }
    
    const { data: originalRequest } = await supabase
      .from('chapter_requests')
      .select('email, full_name')
      .eq('id', id)
      .single()
    
    if (!originalRequest?.email || !originalRequest?.full_name) {
      console.error('Missing request details')
      return Response.redirect(new URL('/admin/chapters', request.url), 303)
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
      return Response.redirect(new URL('/admin/chapters', request.url), 303)
    }
    
    if (!process.env.SUPABASE_SECRET_KEY) {
      console.error('SUPABASE_SECRET_KEY not configured')
      return Response.redirect(new URL('/admin/chapters', request.url), 303)
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
    
    // Generate signed token first (needed for redirect)
    const baseUrl = new URL(request.url).origin
    let token: string
    
    try {
      // First, try to invite the user (this ALWAYS sends an email)
      const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        originalRequest.email,
        {
          data: {
            full_name: originalRequest.full_name,
            user_type: 'coordinator'
          },
          // We'll use generateLink separately to get the token URL
        }
      )
      
      if (inviteError) {
        console.error('Failed to invite user:', inviteError.message)
        // User might already exist - try to get their ID
        const { data: existingUser } = await adminSupabase.auth.admin.listUsers()
        const existing = existingUser?.users.find(u => u.email === originalRequest.email)
        if (existing) {
          userId = existing.id
          console.log('User already exists, using existing ID:', userId)
        }
      } else {
        userId = inviteData.user?.id
        console.log(`\n--- Invite sent to ${originalRequest.email} ---\n`)
      }
    } catch (err) {
      console.error('Invite threw:', err)
    }
    
    // Step 2: Create coordinator link
    if (userId) {
      await supabase.from('coordinators').insert({
        profile_id: userId,
        organization_id: newOrg.id,
        role: 'admin'
      })
    }
    
    // Step 3: Generate signed token for password setup
    if (userId) {
      token = await createSetPasswordToken({
        userId,
        email: originalRequest.email,
        purpose: 'set-password',
        organizationId: newOrg.id
      })
      
      // Log the custom token link for manual use if email fails
      console.log('\n--- SET PASSWORD LINK ---')
      console.log(`${baseUrl}/set-password?token=${token}`)
      console.log('-------------------------\n')
    } else {
      // Fallback - shouldn't happen but handle gracefully
      token = ''
    }
    
    // Step 4: Update chapter request status
    await supabase.from('chapter_requests').update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    revalidatePath('/admin/chapters')
    
    return Response.redirect(new URL('/admin/chapters', request.url), 303)
  } catch (error) {
    console.error('Approve route error:', error)
    return Response.redirect(new URL('/admin/chapters', request.url), 303)
  }
}