import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const formData = await request.formData()
  
  const chapterName = formData.get('chapter_name') as string
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
    return redirect('/login')
  }

  // Check if user is platform owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'platform_owner') {
    return redirect('/dashboard')
  }
  
  // Get the original request to find the requester's details
  const { data: originalRequest } = await supabase
    .from('chapter_requests')
    .select('email, full_name')
    .eq('id', id)
    .single()
  
  // Create the organization
  const slugPart = chapterName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const slug = `tennis-flex-${slugPart}`
  
  const { data: newOrg, error: orgError } = await supabase.from('organizations').insert({
    name: chapterName,
    slug,
    region,
  }).select().single()
  
  if (orgError) {
    console.error('Failed to create organization:', orgError)
    return redirect('/admin/chapters')
  }
  
  // Initialize admin Supabase client with service role key
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SECRET_KEY || '',
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

  // Create the user account (bypassing email confirmation)
  const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
    email: originalRequest?.email,
    email_confirm: true,
    user_metadata: {
      full_name: originalRequest?.full_name,
      user_type: 'coordinator'
    }
  })
  
  if (userError) {
    console.error('Failed to create user:', userError)
    // If user already exists, that's fine, we still want to send a reset link
  }
  
  const userId = newUser?.user?.id
  
  if (userId) {
    // Make them a coordinator of the new organization
    await supabase.from('coordinators').insert({
      profile_id: userId,
      organization_id: newOrg.id,
      role: 'admin'
    })
  }

  // Generate a magic link (bypasses email rate limits during development)
  const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
    type: 'recovery',
    email: originalRequest?.email as string,
    options: {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/set-password`
    }
  })

  if (linkError) {
    console.error('Failed to generate magic link:', linkError)
  } else if (linkData?.properties?.action_link) {
    console.log('\n\n--- 🎾 TENNIS-FLEX DEVELOPMENT MAGIC LINK ---')
    console.log('Copy and paste this into your browser to set the password:')
    console.log(linkData.properties.action_link)
    console.log('---------------------------------------------\n\n')
  }

  // Also try to send the actual email (might fail due to rate limit, but that's okay now)
  await supabase.auth.resetPasswordForEmail(
    originalRequest?.email as string,
    {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/set-password`
    }
  )
  
  // Mark request as approved
  await supabase.from('chapter_requests').update({
    status: 'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)

  // Revalidate the admin page to refresh the list
  revalidatePath('/admin/chapters')
  
  return redirect('/admin/chapters')
}