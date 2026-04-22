import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET() {
  const adminClient = createAdminClient()

  const { data: seasons } = await adminClient
    .from('seasons')
    .select(`
      id,
      name,
      organization:organizations!seasons_organization_id_fkey (name)
    `)
    .eq('status', 'active')
    .order('name', { ascending: true })

  return NextResponse.json({ seasons: seasons || [] })
}