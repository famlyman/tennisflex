import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return redirect('/login')
  }
  
  // Mark request as denied
  await supabase.from('chapter_requests').update({
    status: 'denied',
    reviewed_by: session.user.id,
    reviewed_at: new Date().toISOString(),
    denial_reason: denialReason,
  }).eq('id', id)
  
  return redirect('/admin/chapters')
}