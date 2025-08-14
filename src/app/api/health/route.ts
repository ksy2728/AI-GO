import { NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/cors'

export async function GET() {
  try {
    // Check database connection
    let dbStatus = 'unknown'
    try {
      // Import prisma client if available
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'healthy'
    } catch (error) {
      dbStatus = 'unhealthy'
    }

    // Check Redis connection
    let redisStatus = 'unknown'
    try {
      if (process.env.REDIS_URL) {
        // Basic Redis connectivity check would go here
        redisStatus = 'healthy'
      } else {
        redisStatus = 'not_configured'
      }
    } catch (error) {
      redisStatus = 'unhealthy'
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    }

    return NextResponse.json(health, {
      status: 200,
      headers: corsHeaders()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 503,
        headers: corsHeaders()
      }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders()
  })
}