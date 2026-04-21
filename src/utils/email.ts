import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface SendSetPasswordEmailParams {
  email: string
  fullName: string
  flexName: string
  setPasswordLink: string
}

export async function sendSetPasswordEmail({
  email,
  fullName,
  flexName,
  setPasswordLink
}: SendSetPasswordEmailParams): Promise<boolean> {
  if (!resend) {
    console.log('\n--- RESEND NOT CONFIGURED ---')
    console.log(`Would send email to: ${email}`)
    console.log(`Link: ${setPasswordLink}`)
    console.log('-----------------------------\n')
    return false
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Tennis-Flex <onboarding@resend.dev>',
      to: email,
      subject: `Welcome to Tennis-Flex ${flexName}! Set your password`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to Tennis-Flex, ${fullName}!</h1>
          <p>You've been invited to coordinate <strong>${flexName}</strong>.</p>
          <p>Click the button below to set your password and get started:</p>
          <p style="margin: 32px 0;">
            <a href="${setPasswordLink}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Set Password
            </a>
          </p>
          <p>Or copy this link: ${setPasswordLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return false
    }

    console.log(`\n--- Email sent to ${email} (Resend ID: ${data?.id}) ---\n`)
    return true
  } catch (err) {
    console.error('Failed to send email:', err)
    return false
  }
}