import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Test data patterns to identify and remove
const TEST_MODEL_PATTERNS = [
  'GPT-5',
  'gpt-oss',
  'Grok 3 mini Reasoning',
  'test',
  'demo',
  'example',
  'simulation'
]

/**
 * POST /api/v1/clean-data
 * Clean test data from production database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting production database cleanup...')

    // Check for API key or some form of authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY || 'your-secure-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Identify test models
    const testModels = await prisma.model.findMany({
      where: {
        OR: TEST_MODEL_PATTERNS.map(pattern => ({
          OR: [
            { name: { contains: pattern, mode: 'insensitive' } },
            { slug: { contains: pattern, mode: 'insensitive' } }
          ]
        }))
      }
    })

    const modelIds = testModels.map(m => m.id)

    let deletedCounts = {
      models: 0,
      status: 0,
      benchmarks: 0,
      pricing: 0,
      endpoints: 0,
      incidents: 0
    }

    if (modelIds.length > 0) {
      // Delete related data first (due to foreign key constraints)
      const statusDeleted = await prisma.modelStatus.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      deletedCounts.status = statusDeleted.count

      const benchmarksDeleted = await prisma.benchmarkScore.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      deletedCounts.benchmarks = benchmarksDeleted.count

      const pricingDeleted = await prisma.pricing.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      deletedCounts.pricing = pricingDeleted.count

      const endpointsDeleted = await prisma.modelEndpoint.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      deletedCounts.endpoints = endpointsDeleted.count

      const incidentsDeleted = await prisma.incident.deleteMany({
        where: { modelId: { in: modelIds } }
      })
      deletedCounts.incidents = incidentsDeleted.count

      // Delete the test models themselves
      const modelsDeleted = await prisma.model.deleteMany({
        where: { id: { in: modelIds } }
      })
      deletedCounts.models = modelsDeleted.count
    }

    // Mark remaining models for re-sync
    const remainingModels = await prisma.model.count()

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned successfully',
      testModelsFound: testModels.length,
      deletedCounts,
      remainingModels,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/clean-data
 * Check for test data in database
 */
export async function GET(request: NextRequest) {
  try {
    // Find potential test models
    const testModels = await prisma.model.findMany({
      where: {
        OR: TEST_MODEL_PATTERNS.map(pattern => ({
          OR: [
            { name: { contains: pattern, mode: 'insensitive' } },
            { slug: { contains: pattern, mode: 'insensitive' } }
          ]
        }))
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    const totalModels = await prisma.model.count()

    return NextResponse.json({
      totalModels,
      testModelsFound: testModels.length,
      testModels: testModels.slice(0, 10), // Return first 10 for review
      needsCleaning: testModels.length > 0
    })

  } catch (error: any) {
    console.error('Error checking test data:', error)
    return NextResponse.json(
      { error: 'Check failed', details: error.message },
      { status: 500 }
    )
  }
}