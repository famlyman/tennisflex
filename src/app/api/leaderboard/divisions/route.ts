import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

const DIVISION_LABELS: Record<string, string> = {
  mens_singles: "Men's Singles",
  womens_singles: "Women's Singles",
  mens_doubles: "Men's Doubles",
  womens_doubles: "Women's Doubles",
  mixed_doubles: "Mixed Doubles",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seasonId = searchParams.get('season_id')

  if (!seasonId) {
    return NextResponse.json({ error: 'Season ID required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: divisions } = await adminClient
    .from('divisions')
    .select('id, name, type')
    .eq('season_id', seasonId)
    .order('type', { ascending: true })

  const formattedDivisions = (divisions || []).map(d => ({
    ...d,
    display_name: DIVISION_LABELS[d.type] || d.name
  }))

  return NextResponse.json({ divisions: formattedDivisions })
}