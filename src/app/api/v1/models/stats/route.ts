import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'
import { GitHubDataService } from '@/services/github-data.service'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try to get models from various sources
    let models: any[] = []
    let dataSource = 'database'
    
    // Try database first
    try {
      models = await ModelService.getAll({ limit: 500 }) as any[]
      dataSource = 'database'
    } catch (dbError) {
      console.warn('Database failed, trying GitHub:', dbError)
      
      try {
        // Fallback to GitHub
        models = await GitHubDataService.getAllModels({ limit: 500 })
        dataSource = 'github'
      } catch (githubError) {
        console.warn('GitHub failed, using temp data:', githubError)
        // Final fallback to temporary data
        models = await TempDataService.getAll() as any[]
        dataSource = 'temp-data'
      }
    }

    // Calculate statistics
    const stats = {
      totalModels: models.length,
      activeModels: 0,
      operationalModels: 0,
      degradedModels: 0,
      outageModels: 0,
      unknownModels: 0,
      avgAvailability: 99.5,
      byProvider: {} as Record<string, any>,
      byStatus: {
        operational: 0,
        degraded: 0,
        outage: 0,
        unknown: 0,
      },
      byModality: {} as Record<string, number>,
      lastUpdated: new Date().toISOString(),
      dataSource,
    }

    // Process each model
    models.forEach(model => {
      // Get status
      let status = 'unknown'
      if (model.status) {
        if (Array.isArray(model.status) && model.status.length > 0) {
          status = model.status[0].status || 'unknown'
        } else if (typeof model.status === 'string') {
          status = model.status
        } else if (typeof model.status === 'object' && model.status.status) {
          status = model.status.status
        }
      }

      // Count by status
      switch (status) {
        case 'operational':
          stats.operationalModels++
          stats.activeModels++
          stats.byStatus.operational++
          break
        case 'degraded':
          stats.degradedModels++
          stats.activeModels++
          stats.byStatus.degraded++
          break
        case 'outage':
          stats.outageModels++
          stats.byStatus.outage++
          break
        default:
          stats.unknownModels++
          stats.byStatus.unknown++
      }

      // Count by provider
      const providerId = model.provider?.id || model.providerId || 'unknown'
      const providerName = model.provider?.name || providerId
      
      if (!stats.byProvider[providerId]) {
        stats.byProvider[providerId] = {
          name: providerName,
          total: 0,
          operational: 0,
          degraded: 0,
          outage: 0,
          unknown: 0,
        }
      }
      
      stats.byProvider[providerId].total++
      
      switch (status) {
        case 'operational':
          stats.byProvider[providerId].operational++
          break
        case 'degraded':
          stats.byProvider[providerId].degraded++
          break
        case 'outage':
          stats.byProvider[providerId].outage++
          break
        default:
          stats.byProvider[providerId].unknown++
      }

      // Count by modality
      if (model.modalities && Array.isArray(model.modalities)) {
        model.modalities.forEach((modality: string) => {
          if (!stats.byModality[modality]) {
            stats.byModality[modality] = 0
          }
          stats.byModality[modality]++
        })
      }
    })

    // Calculate average availability (weighted by operational models)
    if (stats.totalModels > 0) {
      const operationalWeight = (stats.operationalModels / stats.totalModels) * 100
      const degradedWeight = (stats.degradedModels / stats.totalModels) * 95 // Degraded = 95% available
      const outageWeight = (stats.outageModels / stats.totalModels) * 0
      
      stats.avgAvailability = Math.round(
        (operationalWeight + degradedWeight + outageWeight) * 100
      ) / 100
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in stats API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch model statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}