// Production Validation API Endpoint
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { productionValidator } from '@/lib/validation/production-validator';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (basic check)
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeChecklist = searchParams.get('checklist') === 'true';

    // Run production validation
    const validationReport = await productionValidator.validateProductionReadiness();

    // Optionally include deployment checklist
    const response: any = {
      success: true,
      validation: validationReport,
      timestamp: new Date().toISOString(),
    };

    if (includeChecklist) {
      response.deploymentChecklist = productionValidator.generateDeploymentChecklist();
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Production validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run production validation',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'fix-suggestions':
        // Return specific fix suggestions for each category
        const report = await productionValidator.validateProductionReadiness();
        const suggestions = {
          critical: report.critical.filter(r => !r.isValid).map(r => ({
            issue: r.message,
            solution: r.solution,
            priority: 'high'
          })),
          warnings: report.warnings.filter(r => !r.isValid).map(r => ({
            issue: r.message,
            solution: r.solution,
            priority: 'medium'
          }))
        };

        return NextResponse.json({
          success: true,
          suggestions,
          totalIssues: suggestions.critical.length + suggestions.warnings.length
        });

      case 'generate-env-template':
        // Generate environment variable template
        const envTemplate = generateEnvTemplate();
        return NextResponse.json({
          success: true,
          envTemplate,
          filename: '.env.production.template'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Production validation action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute validation action',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

function generateEnvTemplate(): string {
  return `# Production Environment Configuration Template
# Copy this file to .env and fill in the values

# ========================================
# CRITICAL SECURITY SETTINGS
# ========================================

# JWT Secret (32+ characters, randomly generated)
JWT_SECRET="your-secure-jwt-secret-here-32-chars-minimum"
JWT_EXPIRES_IN="24h"

# Admin Authentication
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="your-bcrypt-hashed-password-here"

# Node Environment
NODE_ENV="production"

# ========================================
# DATABASE CONFIGURATION
# ========================================

# Production Database (with SSL)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host:port/database?sslmode=require"

# ========================================
# REDIS CACHE CONFIGURATION
# ========================================

# Production Redis
REDIS_URL="redis://username:password@host:port"
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"
REDIS_DB="0"

# ========================================
# EXTERNAL API KEYS
# ========================================

# AI Service APIs
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIza..."
REPLICATE_API_TOKEN="r8_..."

# ========================================
# URLS AND ENDPOINTS
# ========================================

# Application URLs
NEXT_PUBLIC_API_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"

# ========================================
# MONITORING AND ANALYTICS
# ========================================

# Error Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT="production"

# Analytics
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
MIXPANEL_TOKEN="your-mixpanel-token"

# ========================================
# CDN AND PERFORMANCE
# ========================================

# CDN Configuration
CDN_URL="https://your-cdn-domain.com"

# AWS (if using CloudFront/S3)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket"
AWS_CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"

# Cloudflare (if using)
CLOUDFLARE_API_TOKEN="your-cloudflare-token"
CLOUDFLARE_ZONE_ID="your-zone-id"

# ========================================
# API RATE LIMITING
# ========================================

API_RATE_LIMIT_PER_MINUTE="100"

# ========================================
# CRON JOBS AND AUTOMATION
# ========================================

CRON_SECRET="your-secure-cron-secret"

# ========================================
# FEATURE FLAGS
# ========================================

ENABLE_NEWS_SECTION="true"
ENABLE_AI_CHAT="true"
ENABLE_DARK_MODE="true"
ENABLE_BENCHMARKS="true"
ENABLE_ANALYTICS="true"

# ========================================
# OPTIONAL: ADDITIONAL MONITORING
# ========================================

NEW_RELIC_LICENSE_KEY="your-newrelic-key"
DATADOG_API_KEY="your-datadog-key"

# ========================================
# PRIVACY AND COMPLIANCE
# ========================================

NEXT_TELEMETRY_DISABLED="1"

# ========================================
# EMAIL CONFIGURATION (if needed)
# ========================================

SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM="noreply@your-domain.com"
`;
}

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}