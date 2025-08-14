import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers)
  
  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
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
  matcher: '/api/:path*',
}