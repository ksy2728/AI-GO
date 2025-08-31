import { NextRequest, NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'

/**
 * Initialize status records for all models without status
 * POST /api/v1/models/init-status
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting model status initialization...')
    
    const result = await ModelService.initializeAllModelStatus()
    
    return NextResponse.json({
      success: true,
      message: `Initialized ${result.created} status records`,
      data: {
        created: result.created,
        total: result.total,
        coverage: ((result.total - result.created + result.created) / result.total * 100).toFixed(1) + '%'
      },
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('❌ Error initializing model status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize model status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

/**
 * Check status initialization state
 * GET /api/v1/models/init-status
 */
export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Get counts
    const totalModels = await prisma.model.count()
    const modelsWithStatusGroups = await prisma.modelStatus.groupBy({
      by: ['modelId'],
      _count: true
    })
    const modelsWithStatus = modelsWithStatusGroups.length
    
    const coverage = totalModels > 0 
      ? ((modelsWithStatus / totalModels) * 100).toFixed(1)
      : '0'
    
    return NextResponse.json({
      success: true,
      data: {
        totalModels,
        modelsWithStatus,
        modelsWithoutStatus: totalModels - modelsWithStatus,
        coverage: `${coverage}%`,
        initialized: totalModels === modelsWithStatus
      },
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking model status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check model status',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}