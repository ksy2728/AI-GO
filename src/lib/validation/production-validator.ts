// Production Environment Validation
import { redisManager } from '../redis/redis-client';

export interface ValidationResult {
  isValid: boolean;
  category: 'critical' | 'warning' | 'info';
  message: string;
  solution?: string;
}

export interface ProductionValidationReport {
  overallStatus: 'pass' | 'warning' | 'fail';
  critical: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    critical: number;
  };
}

class ProductionValidator {
  private static instance: ProductionValidator;
  private results: ValidationResult[] = [];

  private constructor() {}

  static getInstance(): ProductionValidator {
    if (!ProductionValidator.instance) {
      ProductionValidator.instance = new ProductionValidator();
    }
    return ProductionValidator.instance;
  }

  /**
   * Run all production validation checks
   */
  async validateProductionReadiness(): Promise<ProductionValidationReport> {
    this.results = [];

    // Security validations
    await this.validateSecurityConfig();

    // Database validations
    await this.validateDatabaseConfig();

    // Redis/Caching validations
    await this.validateCacheConfig();

    // API keys and external services
    await this.validateAPIKeys();

    // Environment-specific settings
    await this.validateEnvironmentConfig();

    // Performance and monitoring
    await this.validateMonitoringConfig();

    // Build and categorize results
    return this.buildReport();
  }

  private async validateSecurityConfig(): Promise<void> {
    // JWT Secret validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'default-dev-secret-change-in-production') {
      this.addResult({
        isValid: false,
        category: 'critical',
        message: 'JWT_SECRET is using default development value',
        solution: 'Set a strong, unique JWT_SECRET in production environment variables'
      });
    } else if (jwtSecret.length < 32) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'JWT_SECRET is shorter than recommended 32 characters',
        solution: 'Use a JWT secret of at least 32 characters for better security'
      });
    } else {
      this.addResult({
        isValid: true,
        category: 'info',
        message: 'JWT_SECRET is properly configured'
      });
    }

    // Admin password hash validation
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminPasswordHash) {
      this.addResult({
        isValid: false,
        category: 'critical',
        message: 'ADMIN_PASSWORD_HASH is not set',
        solution: 'Generate and set a bcrypt hash for the admin password'
      });
    } else if (adminPasswordHash === '$2a$10$FEK/TlqgfBQ/lzOq7Eq5yeO.gq7VUo.MeQvVh4cxNRIjv6R.kKaUa') {
      this.addResult({
        isValid: false,
        category: 'critical',
        message: 'ADMIN_PASSWORD_HASH is using default development value',
        solution: 'Generate a new bcrypt hash for production admin password'
      });
    } else {
      this.addResult({
        isValid: true,
        category: 'info',
        message: 'Admin password hash is properly configured'
      });
    }

    // HTTPS validation
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'NEXTAUTH_URL is not using HTTPS',
        solution: 'Update NEXTAUTH_URL to use HTTPS for production'
      });
    }

    // Node environment validation
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv !== 'production') {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: `NODE_ENV is set to '${nodeEnv}' instead of 'production'`,
        solution: 'Set NODE_ENV=production for production deployment'
      });
    } else {
      this.addResult({
        isValid: true,
        category: 'info',
        message: 'NODE_ENV is correctly set to production'
      });
    }
  }

  private async validateDatabaseConfig(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      this.addResult({
        isValid: false,
        category: 'critical',
        message: 'DATABASE_URL is not configured',
        solution: 'Set DATABASE_URL environment variable for database connection'
      });
      return;
    }

    // Check for localhost in production
    if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'DATABASE_URL appears to use localhost',
        solution: 'Use a production database URL instead of localhost'
      });
    }

    // Check for SSL requirement
    if (!databaseUrl.includes('sslmode=require') && !databaseUrl.includes('ssl=true')) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'Database connection may not be using SSL',
        solution: 'Ensure database connection uses SSL in production'
      });
    }

    // Check for default credentials
    if (databaseUrl.includes('postgres:postgres@') || databaseUrl.includes('user:password@')) {
      this.addResult({
        isValid: false,
        category: 'critical',
        message: 'Database URL appears to use default or weak credentials',
        solution: 'Use strong, unique database credentials for production'
      });
    } else {
      this.addResult({
        isValid: true,
        category: 'info',
        message: 'Database configuration appears secure'
      });
    }
  }

  private async validateCacheConfig(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'REDIS_URL is not configured - using in-memory fallback',
        solution: 'Configure Redis for distributed caching and rate limiting'
      });
      return;
    }

    // Test Redis connection
    try {
      await redisManager.connect();
      const isConnected = await redisManager.ping();

      if (isConnected) {
        this.addResult({
          isValid: true,
          category: 'info',
          message: 'Redis connection is working correctly'
        });
      } else {
        this.addResult({
          isValid: false,
          category: 'warning',
          message: 'Redis connection test failed',
          solution: 'Verify Redis server is running and accessible'
        });
      }
    } catch (error) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: `Redis connection error: ${(error as Error).message}`,
        solution: 'Check Redis configuration and network connectivity'
      });
    }

    // Check for localhost in Redis URL
    if (redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'Redis URL appears to use localhost',
        solution: 'Use a production Redis instance instead of localhost'
      });
    }
  }

  private async validateAPIKeys(): Promise<void> {
    const apiKeys = [
      { key: 'OPENAI_API_KEY', name: 'OpenAI API' },
      { key: 'ANTHROPIC_API_KEY', name: 'Anthropic API' },
      { key: 'GOOGLE_AI_API_KEY', name: 'Google AI API' },
      { key: 'REPLICATE_API_TOKEN', name: 'Replicate API' }
    ];

    let validApiKeys = 0;

    for (const { key, name } of apiKeys) {
      const value = process.env[key];

      if (!value) {
        this.addResult({
          isValid: false,
          category: 'warning',
          message: `${name} key (${key}) is not configured`,
          solution: `Set ${key} environment variable if ${name} integration is needed`
        });
      } else if (value.length < 10) {
        this.addResult({
          isValid: false,
          category: 'warning',
          message: `${name} key appears to be invalid (too short)`,
          solution: `Verify ${key} is a valid API key`
        });
      } else {
        validApiKeys++;
        this.addResult({
          isValid: true,
          category: 'info',
          message: `${name} key is configured`
        });
      }
    }

    if (validApiKeys === 0) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'No external API keys are configured',
        solution: 'Configure at least one AI provider API key for full functionality'
      });
    }
  }

  private async validateEnvironmentConfig(): Promise<void> {
    // CRON_SECRET validation
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret === 'development-cron-secret-change-in-production') {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'CRON_SECRET is using default development value',
        solution: 'Set a unique CRON_SECRET for production cron job security'
      });
    } else {
      this.addResult({
        isValid: true,
        category: 'info',
        message: 'CRON_SECRET is properly configured'
      });
    }

    // Telemetry settings
    const telemetryDisabled = process.env.NEXT_TELEMETRY_DISABLED;
    if (telemetryDisabled !== '1') {
      this.addResult({
        isValid: false,
        category: 'info',
        message: 'Next.js telemetry is enabled',
        solution: 'Consider setting NEXT_TELEMETRY_DISABLED=1 for privacy'
      });
    }

    // Rate limiting configuration
    const rateLimitPerMinute = process.env.API_RATE_LIMIT_PER_MINUTE;
    if (!rateLimitPerMinute || parseInt(rateLimitPerMinute) < 1) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'API_RATE_LIMIT_PER_MINUTE is not properly configured',
        solution: 'Set API_RATE_LIMIT_PER_MINUTE to appropriate value for production load'
      });
    }
  }

  private async validateMonitoringConfig(): Promise<void> {
    // Sentry configuration
    const sentryDsn = process.env.SENTRY_DSN;
    if (!sentryDsn) {
      this.addResult({
        isValid: false,
        category: 'warning',
        message: 'Sentry error monitoring is not configured',
        solution: 'Configure SENTRY_DSN for production error tracking'
      });
    } else {
      this.addResult({
        isValid: true,
        category: 'info',
        message: 'Sentry error monitoring is configured'
      });
    }

    // Analytics configuration
    const googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID;
    if (!googleAnalyticsId) {
      this.addResult({
        isValid: false,
        category: 'info',
        message: 'Google Analytics is not configured',
        solution: 'Configure GOOGLE_ANALYTICS_ID for user analytics tracking'
      });
    }

    // CDN configuration
    const cdnUrl = process.env.CDN_URL;
    if (!cdnUrl || cdnUrl === 'https://cdn.example.com') {
      this.addResult({
        isValid: false,
        category: 'info',
        message: 'CDN is not configured',
        solution: 'Configure CDN_URL for better performance and asset delivery'
      });
    }
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result);
  }

  private buildReport(): ProductionValidationReport {
    const critical = this.results.filter(r => r.category === 'critical');
    const warnings = this.results.filter(r => r.category === 'warning');
    const info = this.results.filter(r => r.category === 'info');

    let overallStatus: 'pass' | 'warning' | 'fail';
    if (critical.length > 0) {
      overallStatus = 'fail';
    } else if (warnings.length > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'pass';
    }

    return {
      overallStatus,
      critical,
      warnings,
      info,
      summary: {
        totalChecks: this.results.length,
        passed: info.filter(r => r.isValid).length,
        warnings: warnings.length,
        critical: critical.length,
      }
    };
  }

  /**
   * Generate production deployment checklist
   */
  generateDeploymentChecklist(): string[] {
    return [
      '✅ Generate strong JWT_SECRET (32+ characters)',
      '✅ Create secure admin password hash with bcrypt',
      '✅ Configure production database with SSL',
      '✅ Set up Redis for caching and rate limiting',
      '✅ Configure API keys for required services',
      '✅ Set NODE_ENV=production',
      '✅ Update all default secrets and passwords',
      '✅ Configure HTTPS URLs for all services',
      '✅ Set up error monitoring (Sentry)',
      '✅ Configure analytics tracking',
      '✅ Set up CDN for static assets',
      '✅ Verify rate limiting is working',
      '✅ Test authentication flows',
      '✅ Verify database migrations',
      '✅ Check all environment variables',
      '✅ Run production validation checks',
    ];
  }
}

export const productionValidator = ProductionValidator.getInstance();
export default productionValidator;