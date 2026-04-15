import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return redirect('/login')
  }
  
  // Create the chapter (organization)
  const slug = chapterName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  const { error: orgError } = await supabase.from('organizations').insert({
    name: chapterName,
    slug,
    region,
    is_active: true,
    created_by: session.user.id,
  })
  
  if (orgError) {
    console.error('Failed to create organization:', orgError)
    // Continue anyway to mark request as processed
  }
  
  // Mark request as approved
  await supabase.from('chapter_requests').update({
    status: 'approved',
    reviewed_by: session.user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)
  
  // TODO: Make requester a coordinator of the new organization
  
  return redirect('/admin/chapters')
}