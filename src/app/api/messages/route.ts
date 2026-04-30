import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id')
    
    if (!matchId) {
      return NextResponse.json({ error: 'match_id is required' }, { status: 400 })
    }

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch messages for this match
    // Try both with and without the explicit FK name to be safe
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(full_name)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) {
      // Fallback for different FK name
      const { data: retryMessages, error: retryError } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
      
      if (retryError) throw retryError
      return NextResponse.json({ messages: retryMessages || [] })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (err: any) {
    console.error('GET Messages Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id')
    
    if (!matchId) {
      return NextResponse.json({ error: 'match_id is required' }, { status: 400 })
    }

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 })
    }

    // Create message using the user's client (honors RLS)
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: content.trim()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert message error:', insertError)
      return NextResponse.json({ 
        error: insertError.message, 
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 })
    }

    // Notify opponent - use admin client to ensure we can read match/player data
    const adminClient = createAdminClient()
    const { data: match } = await adminClient
      .from('matches')
      .select('home_player_id, away_player_id')
      .eq('id', matchId)
      .single()

    if (match) {
      const { data: playerRecord } = await adminClient
        .from('players')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      const opponentId = playerRecord?.id === match.home_player_id 
        ? match.away_player_id 
        : match.home_player_id

      if (opponentId) {
        const { data: opponent } = await adminClient
          .from('players')
          .select('profile_id')
          .eq('id', opponentId)
          .single()

        if (opponent) {
          await adminClient.from('notifications').insert({
            user_id: opponent.profile_id,
            type: 'message_received',
            title: 'New Message',
            message: `You have a new message about your match`,
            link: `/matches/${matchId}`,
            read: false
          })
        }
      }
    }

    return NextResponse.json({ message })
  } catch (err: any) {
    console.error('POST Message Error:', err)
    return NextResponse.json({ 
      error: err.message, 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }, { status: 500 })
  }
}