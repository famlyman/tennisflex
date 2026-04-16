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
    
    const denialReason = formData.get('denial_reason') as string || 'Request denied by admin'
    
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
    
    await supabase.from('chapter_requests').update({
      status: 'denied',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      denial_reason: denialReason,
    }).eq('id', id)
    
    revalidatePath('/admin/chapters')
    
    return Response.redirect(new URL('/admin/chapters', request.url), 303)
  } catch (error) {
    console.error('Deny route error:', error)
    return Response.redirect(new URL('/admin/chapters', request.url), 303)
  }
}