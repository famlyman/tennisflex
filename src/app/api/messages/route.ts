import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('match_id')
  
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
  // We use the profile join to get the sender name
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles(full_name)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ messages: messages || [] })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('match_id')
  
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

  // Create message
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
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Notify opponent - get the match to find opponent
  const { data: match } = await supabase
    .from('matches')
    .select('home_player_id, away_player_id')
    .eq('id', matchId)
    .single()

  if (match) {
    // We need to know which player record corresponds to the current user to find the opponent
    const { data: playerRecord } = await supabase
      .from('players')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

    const opponentId = playerRecord?.id === match.home_player_id 
      ? match.away_player_id 
      : match.home_player_id

    if (opponentId) {
      // Get opponent's profile_id
      const { data: opponent } = await supabase
        .from('players')
        .select('profile_id')
        .eq('id', opponentId)
        .single()

      if (opponent) {
        await supabase.from('notifications').insert({
          user_id: opponent.profile_id,
          type: 'message_received',
          title: 'New Message',
          message: `You have a new message about your upcoming match`,
          link: `/matches/${matchId}`
        })
      }
    }
  }

  return NextResponse.json({ message })
}