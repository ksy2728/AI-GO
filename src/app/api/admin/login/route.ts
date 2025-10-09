// Admin Login API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthUtils } from '@/lib/auth/auth.utils';
import { JWTManager } from '@/lib/auth/jwt';
import type { LoginCredentials, AuthResponse } from '@/lib/auth/auth.types';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limiting check (now async)
    const rateLimitAllowed = await AuthUtils.checkRateLimit(clientIp);
    if (!rateLimitAllowed) {
      // Get additional rate limit info for better error response
      const rateLimitStatus = await AuthUtils.getRateLimitStatus(clientIp);
      const resetTime = new Date(rateLimitStatus.resetTime).toLocaleTimeString();

      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again after ${resetTime}.`,
          rateLimitInfo: {
            remainingAttempts: rateLimitStatus.remainingAttempts,
            resetTime: rateLimitStatus.resetTime,
            totalHits: rateLimitStatus.totalHits,
          }
        } as AuthResponse,
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const credentials: LoginCredentials = {
      username: body.username,
      password: body.password,
    };

    // Validate required fields
    if (!credentials.username || !credentials.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username and password are required',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Validate credentials
    const isValid = await AuthUtils.validateCredentials(credentials);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Clear rate limit on successful login
    await AuthUtils.clearRateLimit(clientIp);

    // Create user object
    const user = AuthUtils.createAdminUser(credentials.username);

    // Generate JWT token
    const token = JWTManager.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Create response with cookie
    const response = NextResponse.json(
      {
        success: true,
        token,
        user,
      } as AuthResponse,
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', token, JWTManager.getCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during login',
      } as AuthResponse,
      { status: 500 }
    );
  }
}

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}