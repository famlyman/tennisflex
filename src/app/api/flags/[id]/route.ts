import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: flagId } = await params
  const adminClient = createAdminClient()
  
  try {
    const body = await request.json()
    const { status, coordinator_note, new_rating_singles, new_rating_doubles } = body
    
    if (!status || !['reviewed', 'upheld', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Valid status required (reviewed, upheld, dismissed)' }, { status: 400 })
    }
    
    const { data: flag, error: flagError } = await adminClient
      .from('rating_flags')
      .select(`
        *,
        target_player:players!rating_flags_target_player_id_fkey (*)
      `)
      .eq('id', flagId)
      .single()
    
    if (flagError || !flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }
    
    const updates: any = {
      status,
      reviewed_at: new Date().toISOString()
    }
    
    if (coordinator_note) {
      updates.coordinator_note = coordinator_note
    }
    
    const { data: updatedFlag, error: updateError } = await adminClient
      .from('rating_flags')
      .update(updates)
      .eq('id', flagId)
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
    
    if (updateError) {
      console.error('Flag update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    if (status === 'upheld') {
      const playerUpdates: any = {}
      
      if (new_rating_singles !== undefined) {
        playerUpdates.tfr_singles = new_rating_singles
      }
      if (new_rating_doubles !== undefined) {
        playerUpdates.tfr_doubles = new_rating_doubles
      }
      
      if (Object.keys(playerUpdates).length > 0) {
        await adminClient
          .from('players')
          .update(playerUpdates)
          .eq('id', flag.target_player_id)
      }
      
      await adminClient
        .from('players')
        .update({ flag_count: adminClient.rpc('decrement', { row_id: flag.target_player_id }) })
        .eq('id', flag.target_player_id)
    }
    
    return NextResponse.json({ flag: updatedFlag })
  } catch (err: any) {
    console.error('Flag update API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: flagId } = await params
  const adminClient = createAdminClient()
  
  try {
    const { data: flag, error } = await adminClient
      .from('rating_flags')
      .select(`
        *,
        reporter:profiles!rating_flags_reporter_id_fkey (id, full_name),
        target_player:players!rating_flags_target_player_id_fkey (
          id,
          tfr_singles,
          tfr_doubles,
          match_count_singles,
          match_count_doubles,
          profile:profiles (full_name)
        )
      `)
      .eq('id', flagId)
      .single()
    
    if (error || !flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }
    
    return NextResponse.json({ flag })
  } catch (err: any) {
    console.error('Flag fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
