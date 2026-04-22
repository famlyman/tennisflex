import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const divisionId = searchParams.get('division_id')

  if (!divisionId) {
    return NextResponse.json({ error: 'Division ID required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: skill_levels } = await adminClient
    .from('skill_levels')
    .select('id, name')
    .eq('division_id', divisionId)
    .order('name', { ascending: true })

  return NextResponse.json({ skill_levels: skill_levels || [] })
}