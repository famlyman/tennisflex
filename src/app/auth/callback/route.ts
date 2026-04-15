import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
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
    await supabase.auth.exchangeCodeForSession(code)
  }

  // If this was an invitation or recovery, we might want to send them to set-password
  // But standard flow is to check the 'next' param or default to dashboard
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  // Special handling for initial invitation: if the user came from an invite, 
  // they won't have a password yet. 
  // We can check if the type is 'recovery' or 'invite' in some setups, 
  // but a safe bet is to look for a specific flag or just send to set-password 
  // if we want to be explicit.
  
  // For now, let's just use the 'next' param or default to dashboard.
  // To explicitly handle the invite -> set-password flow, we can check if it's an invite code.
  return NextResponse.redirect(new URL(next, request.url))
}
