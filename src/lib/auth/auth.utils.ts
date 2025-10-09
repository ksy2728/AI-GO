// Authentication Utilities
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { JWTManager } from './jwt';
import type { AdminUser, LoginCredentials, SessionValidation } from './auth.types';

const COOKIE_NAME = 'admin-token';
const SALT_ROUNDS = 10;

export class AuthUtils {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare plain text password with hashed password
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Validate admin credentials
   */
  static async validateCredentials(credentials: LoginCredentials): Promise<boolean> {
    // In production, this should check against database
    // For now, we use environment variable
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';

    if (credentials.username !== adminUsername) {
      return false;
    }

    // If no hash is set, compare with a default development password
    if (!adminPasswordHash && process.env.NODE_ENV === 'development') {
      // Default dev password: admin123
      const devPasswordHash = '$2a$10$FEK/TlqgfBQ/lzOq7Eq5yeO.gq7VUo.MeQvVh4cxNRIjv6R.kKaUa';
      return this.verifyPassword(credentials.password, devPasswordHash);
    }

    return this.verifyPassword(credentials.password, adminPasswordHash);
  }

  /**
   * Create admin user object
   */
  static createAdminUser(username: string): AdminUser {
    return {
      id: '1', // In production, use UUID or database ID
      username,
      role: 'admin',
      lastLogin: new Date(),
    };
  }

  /**
   * Set authentication cookie
   */
  static async setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, JWTManager.getCookieOptions());
  }

  /**
   * Get authentication token from cookie
   */
  static async getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME);
    return token?.value || null;
  }

  /**
   * Clear authentication cookie
   */
  static async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  }

  /**
   * Validate current session
   */
  static async validateSession(): Promise<SessionValidation> {
    try {
      const token = await this.getAuthToken();

      if (!token) {
        return {
          isValid: false,
          error: 'No authentication token found',
        };
      }

      const payload = JWTManager.verifyToken(token);

      if (!payload) {
        return {
          isValid: false,
          error: 'Invalid or expired token',
        };
      }

      const user: AdminUser = {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
      };

      return {
        isValid: true,
        user,
      };
    } catch {
      return {
        isValid: false,
        error: 'Session validation failed',
      };
    }
  }

  /**
   * Generate a secure random secret
   */
  static generateSecret(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let secret = '';

    if (typeof window !== 'undefined' && window.crypto) {
      // Browser environment
      const array = new Uint32Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        secret += chars[array[i] % chars.length];
      }
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      // Node.js environment with Web Crypto available
      const array = new Uint32Array(length);
      globalThis.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        secret += chars[array[i] % chars.length];
      }
    } else {
      // Fallback to Math.random (less secure but better than failing)
      for (let i = 0; i < length; i++) {
        secret += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    return secret;
  }

  /**
   * Rate limiting check (Redis-based with fallback)
   */
  static async checkRateLimit(identifier: string): Promise<boolean> {
    try {
      const { rateLimiter } = await import('./rate-limiter');
      const result = await rateLimiter.checkRateLimit(identifier, 'LOGIN');
      return result.allowed;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fallback to allowing request if rate limiter fails
      return true;
    }
  }

  /**
   * Clear rate limit for an identifier
   */
  static async clearRateLimit(identifier: string): Promise<void> {
    try {
      const { rateLimiter } = await import('./rate-limiter');
      await rateLimiter.clearRateLimit(identifier, 'LOGIN');
    } catch (error) {
      console.error('Clear rate limit failed:', error);
    }
  }

  /**
   * Get rate limit status without incrementing
   */
  static async getRateLimitStatus(identifier: string) {
    try {
      const { rateLimiter } = await import('./rate-limiter');
      return await rateLimiter.getRateLimitStatus(identifier, 'LOGIN');
    } catch (error) {
      console.error('Get rate limit status failed:', error);
      return {
        remainingAttempts: 5,
        resetTime: Date.now() + 15 * 60 * 1000,
        totalHits: 0,
      };
    }
  }
}