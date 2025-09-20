import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { JWTManager } from '@/lib/auth/jwt'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Check if this is an admin route (but not the login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      // No token, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token
    const payload = JWTManager.verifyToken(token)

    if (!payload) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)

      // Clear invalid cookie
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin-token')
      return response
    }

    // Token is valid, add user info to headers for downstream use
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)
  }

  // Check if this is a protected API route
  if (pathname.startsWith('/api/admin/') &&
      !pathname.startsWith('/api/admin/login') &&
      !pathname.startsWith('/api/admin/session')) {

    // Get token from cookie or Authorization header
    const token = request.cookies.get('admin-token')?.value ||
                  JWTManager.extractTokenFromHeader(request.headers.get('authorization'))

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = JWTManager.verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user info to headers
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)
  }

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    // Allow all origins in development, specific origins in production
    const origin = request.headers.get('origin')

    if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins including file:// and null
      response.headers.set('Access-Control-Allow-Origin', '*')
    } else {
      // In production, check allowed origins
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3006']

      if (origin && (allowedOrigins.includes(origin) || !origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*')
      }
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
}