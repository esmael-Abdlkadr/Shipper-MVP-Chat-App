import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_NAME = process.env.EMAIL_FROM_NAME || 'Shipper Chat'
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@esmaelabdlkadr.dev'

export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string | null
) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
  const userName = name || 'there'

  const { error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Verify your email - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Welcome to ${APP_NAME}!</h1>
              <p style="color: #71717a; font-size: 16px; margin: 0 0 24px 0;">Hi ${userName},</p>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thanks for signing up! Please verify your email address by clicking the button below.
              </p>
              <a href="${verifyUrl}" style="display: inline-block; background-color: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                Verify Email
              </a>
              <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
                This link expires in 24 hours.
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Failed to send verification email:', error)
    throw new Error('Failed to send verification email')
  }

  return { success: true }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string | null
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  const userName = name || 'there'

  const { error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `Reset your password - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Reset your password</h1>
              <p style="color: #71717a; font-size: 16px; margin: 0 0 24px 0;">Hi ${userName},</p>
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 500; font-size: 16px;">
                Reset Password
              </a>
              <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
                This link expires in 1 hour.
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }

  return { success: true }
}

