// Authentication Types and Interfaces

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'super_admin';
  lastLogin?: Date;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: 'admin' | 'super_admin';
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AdminUser;
  error?: string;
  rateLimitInfo?: {
    remainingAttempts: number;
    resetTime: number;
    totalHits: number;
  };
}

export interface SessionValidation {
  isValid: boolean;
  user?: AdminUser;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  adminPassword: string;
  cookieName: string;
  cookieMaxAge: number;
}