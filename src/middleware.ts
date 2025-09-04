import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/simple-login', '/api/test', '/api/debug']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('auth-session')
  
  if (!sessionCookie) {
    // No session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    // Decode session data
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString())
    
    // Check if session is expired (24 hours)
    const isExpired = Date.now() - sessionData.timestamp > 86400000
    if (isExpired) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-session')
      return response
    }
    
    // Admin routes protection
    if (pathname.startsWith('/dashboard') && sessionData.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/calendar', request.url))
    }
    
    // User routes protection (when we implement user login)
    if (pathname.startsWith('/calendar') && !sessionData.role) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return NextResponse.next()
    
  } catch (error) {
    // Invalid session, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-session')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
