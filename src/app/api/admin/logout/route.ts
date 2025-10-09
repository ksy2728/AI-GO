// Admin Logout API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { AuthResponse } from '@/lib/auth/auth.types';

export async function POST(_request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      } as AuthResponse,
      { status: 200 }
    );

    // Clear the authentication cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Immediately expire the cookie
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred during logout',
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