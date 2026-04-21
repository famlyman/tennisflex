import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  // Get all matches to see what's in the DB
  const { data: allMatches, error: matchesError } = await supabase
    .from('matches')
    .select('id, skill_level_id, home_player_id, away_player_id, status')
    .limit(20)

  // Get all skill levels to see what's available
  const { data: skillLevels, error: slError } = await supabase
    .from('skill_levels')
    .select('id, name, division_id')
    .limit(20)

  return NextResponse.json({
    matches: allMatches || [],
    matchesError: matchesError?.message || null,
    skillLevels: skillLevels || [],
    slError: slError?.message || null,
  })
}
