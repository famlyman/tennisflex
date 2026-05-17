import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    const adminClient = createAdminClient()
    let query = adminClient
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (location) {
      query = query.contains('display_locations', [location])
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('GET /api/promotions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
