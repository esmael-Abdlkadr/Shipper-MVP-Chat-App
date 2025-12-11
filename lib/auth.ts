import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// Session durations
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60 // 30 days
const DEFAULT_MAX_AGE = 24 * 60 * 60 // 24 hours

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = PrismaAdapter(prisma as any)

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://')
const cookiePrefix = useSecureCookies ? '__Secure-' : ''

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { 
    strategy: 'jwt',
    maxAge: DEFAULT_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        maxAge: 60 * 15,
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          rememberMe: credentials.rememberMe === 'true',
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
   
        if (user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          }).catch(() => {}) // Ignore errors for new users not yet in DB
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true },
        })

        if (existingUser) {
          const hasGoogleAccount = existingUser.accounts.some(
            (acc) => acc.provider === 'google'
          )

          if (!hasGoogleAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })
          }

     
          if (!existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            })
          }
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        if ('rememberMe' in user && user.rememberMe) {
          token.maxAge = REMEMBER_ME_MAX_AGE
        }
      }

      if (trigger === 'update' && session) {
        token.name = session.name
        token.picture = session.image
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }

      return session
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      })
    },
    async signOut(message) {
      if ('token' in message && message.token?.id) {
        await prisma.user.update({
          where: { id: message.token.id as string },
          data: { isOnline: false, lastSeen: new Date() },
        }).catch(() => {})
      }
    },
  },
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
    }
  }
  
  interface User {
    rememberMe?: boolean
  }
}
