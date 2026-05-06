import { createAdminClient } from '@/utils/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, chapter_name, region, reason } = body

    if (!email || !full_name || !chapter_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('chapter_requests')
      .insert({
        email,
        full_name,
        chapter_name,
        region,
        reason,
        status: 'pending'
      })

    if (error) {
      console.error('Error submitting chapter request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Chapter request API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
