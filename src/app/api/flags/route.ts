import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const adminClient = createAdminClient()
  const url = new URL(request.url)
  
  const organizationId = url.searchParams.get('organization_id')
  const status = url.searchParams.get('status')
  
  try {
    let query = adminClient
      .from('rating_flags')
      .select(`
        *,
        reporter:profiles!rating_flags_reporter_id_fkey (id, full_name),
        target_player:players!rating_flags_target_player_id_fkey (
          id,
          tfr_singles,
          tfr_doubles,
          profile:profiles (full_name)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data: flags, error } = await query
    
    if (error) {
      console.error('Flags fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    let filteredFlags = flags || []
    
    if (organizationId) {
      const { data: orgPlayers } = await adminClient
        .from('players')
        .select('id')
        .eq('organization_id', organizationId)
      
      const orgPlayerIds = new Set((orgPlayers || []).map(p => p.id))
      filteredFlags = filteredFlags.filter(f => 
        orgPlayerIds.has(f.target_player_id)
      )
    }
    
    return NextResponse.json({ flags: filteredFlags })
  } catch (err: any) {
    console.error('Flags API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const { target_player_id, reason } = body
    
    if (!target_player_id || !reason) {
      return NextResponse.json({ error: 'target_player_id and reason are required' }, { status: 400 })
    }
    
    const { data: targetPlayer } = await adminClient
      .from('players')
      .select('id, profile_id')
      .eq('id', target_player_id)
      .single()
    
    if (!targetPlayer) {
      return NextResponse.json({ error: 'Target player not found' }, { status: 404 })
    }
    
    const { data: flag, error } = await adminClient
      .from('rating_flags')
      .insert({
        reporter_id: targetPlayer.profile_id,
        target_player_id,
        reason,
        status: 'pending'
      })
      .select(`
        *,
        reporter:profiles!rating_flags_reporter_id_fkey (id, full_name),
        target_player:players!rating_flags_target_player_id_fkey (
          id,
          tfr_singles,
          tfr_doubles,
          profile:profiles (full_name)
        )
      `)
      .single()
    
    if (error) {
      console.error('Flag creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    await adminClient
      .from('players')
      .update({ flag_count: adminClient.rpc('increment', { row_id: target_player_id }) })
      .eq('id', target_player_id)
    
    return NextResponse.json({ flag })
  } catch (err: any) {
    console.error('Flag creation API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
