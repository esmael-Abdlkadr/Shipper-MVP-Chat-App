import { randomBytes } from 'crypto'
import { prisma } from './prisma'

const EMAIL_VERIFICATION_EXPIRY_HOURS = 24
const PASSWORD_RESET_EXPIRY_HOURS = 1

export async function generateVerificationToken(userId: string): Promise<string> {
  await prisma.verificationToken.deleteMany({
    where: { userId, type: 'email' },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      type: 'email',
      expiresAt,
    },
  })

  return token
}

export async function generatePasswordResetToken(userId: string): Promise<string> {
  await prisma.verificationToken.deleteMany({
    where: { userId, type: 'password-reset' },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      type: 'password-reset',
      expiresAt,
    },
  })

  return token
}

export async function validateToken(
  token: string,
  type: 'email' | 'password-reset'
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { valid: false, error: 'Invalid token' }
  }

  if (verificationToken.type !== type) {
    return { valid: false, error: 'Invalid token type' }
  }

  if (verificationToken.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } })
    return { valid: false, error: 'Token has expired' }
  }

  return { valid: true, userId: verificationToken.userId }
}

export async function deleteToken(token: string): Promise<void> {
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {})
}

