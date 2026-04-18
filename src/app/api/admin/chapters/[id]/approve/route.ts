import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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
    
    try {
      const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
        email: originalRequest.email,
        email_confirm: true,
        user_metadata: {
          full_name: originalRequest.full_name,
          user_type: 'coordinator'
        }
      })
      
      if (userError) {
        console.error('Failed to create user (may already exist):', userError.message)
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

    try {
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'invite',
        email: originalRequest.email,
        options: {
          redirectTo: `${new URL(request.url).origin}/auth/callback?next=/set-password`
        }
      })

      if (linkError) {
        console.error('Failed to generate magic link:', linkError.message)
      } else if (linkData?.properties?.action_link) {
        console.log('\n\n--- TENNIS-FLEX MAGIC LINK ---')
        console.log('Copy and paste this into your browser to set the password:')
        console.log(linkData.properties.action_link)
        console.log('---------------------------------------------\n\n')
      }
    } catch (err) {
      console.error('Magic link generation threw:', err)
    }
    
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
