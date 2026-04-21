import { NextResponse } from 'next/server'
import { verifySetPasswordToken } from '@/utils/token'
import { createAdminClient } from '@/utils/supabase'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
    }

    // Step 1: Verify the signed token
    const payload = await verifySetPasswordToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Step 2: Validate password
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Step 3: Update user's password using admin client
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      payload.userId,
      { password }
    )

    if (updateError) {
      console.error('Failed to update password:', updateError.message)
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password set successfully' })
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}