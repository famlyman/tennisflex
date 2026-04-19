import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return new TextEncoder().encode(secret)
}

export type SetPasswordTokenPayload = {
  userId: string
  email: string
  purpose: 'set-password'
  organizationId?: string
}

/**
 * Create a signed token for password setup
 * @param payload - The payload containing userId, email, and purpose
 * @returns Signed JWT token
 */
export async function createSetPasswordToken(payload: SetPasswordTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecret())
}

/**
 * Verify and decode a signed token
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid
 */
export async function verifySetPasswordToken(token: string): Promise<SetPasswordTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.purpose !== 'set-password') {
      return null
    }
    return payload as unknown as SetPasswordTokenPayload
  } catch {
    return null
  }
}