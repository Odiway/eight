import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'

// Pages that require admin access
const adminOnlyPages = [
  '/dashboard',
  '/projects', 
  '/team',
  '/workload',
  '/reports',
  '/settings',
  '/notifications',
  '/deadline-calculator',
  '/playground'
]

// Pages that regular users can access
const userPages = [
  '/calendar'
]

// Public pages (no auth required)
const publicPages = [
  '/',
  '/login'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public pages
  if (publicPages.includes(pathname) || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Get token from header or cookie
  const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.cookies.get('auth-token')?.value

  if (!token) {
    // No token - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Check admin-only pages
    if (adminOnlyPages.some(page => pathname.startsWith(page))) {
      if (decoded.role !== 'ADMIN') {
        // Non-admin trying to access admin page - redirect to calendar
        return NextResponse.redirect(new URL('/calendar', request.url))
      }
    }

    // Check if regular user is trying to access something other than allowed pages
    if (decoded.role === 'USER' && !userPages.some(page => pathname.startsWith(page))) {
      // Regular user trying to access unauthorized page - redirect to calendar
      return NextResponse.redirect(new URL('/calendar', request.url))
    }

    return NextResponse.next()
    
  } catch (error) {
    // Invalid token - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)  
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
