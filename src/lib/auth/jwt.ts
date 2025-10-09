// JWT Token Management
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { JWTPayload } from './auth.types';

export class JWTManager {
  private static secret: string = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
  private static expiresIn: string | number = process.env.JWT_EXPIRES_IN || '24h';

  /**
   * Generate a JWT token
   */
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as any,
    };
    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Decode token without verification (useful for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT decode failed:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    // Support both "Bearer token" and direct token format
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1];
    }

    // If no Bearer prefix, assume it's the token directly
    return authHeader;
  }

  /**
   * Create cookie options for token storage
   */
  static getCookieOptions(maxAge: number = 24 * 60 * 60 * 1000) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      path: '/',
    };
  }
}