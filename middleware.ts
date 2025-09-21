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
    // Allow all Vercel preview deployments and production domains
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      'https://ai-server-information.vercel.app',
      'https://ai-server-information-orcin.vercel.app',
      'https://ai-go.vercel.app',
      'http://localhost:3000',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008',
    ]

    // Allow any Vercel preview deployment
    if (origin && (allowedOrigins.includes(origin) || origin.includes('.vercel.app'))) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Max-Age', '86400')
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers })
    }
  }

  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Skip static files and images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}