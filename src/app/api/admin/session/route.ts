// Admin Session Validation API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AuthUtils } from '@/lib/auth/auth.utils';
import type { SessionValidation } from '@/lib/auth/auth.types';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          isValid: false,
          error: 'No authentication token found',
        } as SessionValidation,
        { status: 401 }
      );
    }

    // Validate session using the token from cookie
    const validation = await AuthUtils.validateSession();

    if (!validation.isValid) {
      return NextResponse.json(
        validation,
        { status: 401 }
      );
    }

    // Return valid session
    return NextResponse.json(
      validation,
      { status: 200 }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      {
        isValid: false,
        error: 'Session validation failed',
      } as SessionValidation,
      { status: 500 }
    );
  }
}

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}