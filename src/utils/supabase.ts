import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

// Client-side Supabase client
export const supabaseClient: SupabaseClient | null = 
  supabaseUrl && supabasePublishableKey ? createClient(supabaseUrl, supabasePublishableKey) : null

// Admin client (Server-side only, for sensitive operations)
export function createAdminClient() {
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || ''
  if (!supabaseSecretKey) {
    throw new Error('SUPABASE_SECRET_KEY is not set')
  }
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
