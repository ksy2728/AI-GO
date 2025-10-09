// Rate Limit Status API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/auth/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Get rate limit status
    const status = await rateLimiter.getRateLimitStatus(clientIp, 'LOGIN');
    const systemStats = rateLimiter.getSystemStats();

    return NextResponse.json({
      success: true,
      clientIp,
      rateLimit: status,
      system: systemStats,
    });

  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get rate limit status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get client IP from request body or headers
    const body = await request.json().catch(() => ({}));
    const targetIp = body.ip ||
                     request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Clear rate limit for the IP
    await rateLimiter.clearRateLimit(targetIp, 'LOGIN');

    return NextResponse.json({
      success: true,
      message: `Rate limit cleared for IP: ${targetIp}`,
      clearedIp: targetIp,
    });

  } catch (error) {
    console.error('Clear rate limit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear rate limit' },
      { status: 500 }
    );
  }
}

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}