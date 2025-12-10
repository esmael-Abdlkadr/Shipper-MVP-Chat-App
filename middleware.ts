import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

export async function middleware(req: NextRequest) {
  const { nextUrl } = req
  
  // Get JWT token without importing Prisma
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const isLoggedIn = !!token

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
  )

  const isAuthRoute = authRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
  )

  const isApiRoute = nextUrl.pathname.startsWith('/api')

  // Skip API routes
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/chat', nextUrl))
  }

  // Redirect non-logged-in users to login
  if (!isPublicRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
