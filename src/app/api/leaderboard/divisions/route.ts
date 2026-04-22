import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

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
    .order('name', { ascending: true })

  return NextResponse.json({ divisions: divisions || [] })
}