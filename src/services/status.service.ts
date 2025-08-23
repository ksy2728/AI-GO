import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export interface SystemStats {
  totalModels: number
  activeModels: number
  providers: number
  avgAvailability: number
  operationalModels: number
  degradedModels: number
  outageModels: number
  totalBenchmarks: number
  lastUpdated: Date
}

export interface DetailedStatus {
  system: SystemStats
  providers: Array<{
    id: string
    name: string
    slug: string
    totalModels: number
    operationalModels: number
    degradedModels: number
    outageModels: number
    avgAvailability: number
    avgLatency: number
    status: 'operational' | 'degraded' | 'outage'
  }>
  recentIncidents: Array<{
    id: string
    title: string
    severity: string
    status: string
    startedAt: Date
    resolvedAt?: Date
    provider?: string
    model?: string
  }>
}

export class StatusService {
  /**
   * Get system-wide statistics
   */
  static async getSystemStats(): Promise<SystemStats> {
    const cacheKey = 'system:stats'
    
    // Check cache first
    const cached = await cache.get<SystemStats>(cacheKey)
    if (cached) {
      console.log('📦 System stats cache hit')
      return cached
    }

    try {
      // Get total counts
      const [totalModels, activeModels, providersCount] = await Promise.all([
        prisma.model.count(),
        prisma.model.count({ where: { isActive: true } }),
        prisma.provider.count(),
      ])

      // Get current status distribution
      const statusCounts = await prisma.modelStatus.groupBy({
        by: ['status'],
        where: {
          checkedAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
          }
        },
        _count: {
          status: true
        }
      })

      // Calculate status counts
      const operationalModels = statusCounts.find(s => s.status === 'operational')?._count.status || 0
      const degradedModels = statusCounts.find(s => s.status === 'degraded')?._count.status || 0
      const outageModels = statusCounts.find(s => s.status === 'outage')?._count.status || 0

      // Calculate average availability from recent status checks
      const avgAvailabilityResult = await prisma.modelStatus.aggregate({
        where: {
          checkedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        _avg: {
          availability: true
        }
      })

      // Get total benchmarks
      const totalBenchmarks = await prisma.benchmarkScore.count({
        where: { isOfficial: true }
      })

      const stats: SystemStats = {
        totalModels,
        activeModels,
        providers: providersCount,
        avgAvailability: Math.round((avgAvailabilityResult._avg.availability || 99.9) * 10) / 10,
        operationalModels,
        degradedModels,
        outageModels,
        totalBenchmarks,
        lastUpdated: new Date()
      }

      // Cache for 2 minutes
      await cache.set(cacheKey, stats, 120)
      console.log(`📊 Calculated system stats: ${totalModels} total, ${activeModels} active, ${operationalModels} operational`)
      
      return stats
    } catch (error) {
      console.error('❌ Error fetching system stats:', error)
      throw new Error('Failed to fetch system statistics')
    }
  }

  /**
   * Get detailed status including provider breakdown
   */
  static async getDetailedStatus(): Promise<DetailedStatus> {
    const cacheKey = 'system:detailed-status'
    
    // Check cache first
    const cached = await cache.get<DetailedStatus>(cacheKey)
    if (cached) {
      console.log('📦 Detailed status cache hit')
      return cached
    }

    try {
      // Get system stats
      const systemStats = await this.getSystemStats()

      // Get provider status breakdown
      const providers = await prisma.provider.findMany({
        include: {
          models: {
            where: { isActive: true },
            include: {
              status: {
                take: 1,
                orderBy: { checkedAt: 'desc' }
              }
            }
          }
        }
      })

      const providerStatus = providers.map(provider => {
        const models = provider.models
        const operationalCount = models.filter(m => m.status[0]?.status === 'operational').length
        const degradedCount = models.filter(m => m.status[0]?.status === 'degraded').length
        const outageCount = models.filter(m => m.status[0]?.status === 'outage').length
        
        const totalAvailability = models.reduce((sum, m) => 
          sum + (m.status[0]?.availability || 0), 0
        )
        const avgAvailability = models.length > 0 ? totalAvailability / models.length : 0

        const totalLatency = models.reduce((sum, m) => 
          sum + (m.status[0]?.latencyP95 || 0), 0
        )
        const avgLatency = models.length > 0 ? totalLatency / models.length : 0

        // Determine overall provider status
        let status: 'operational' | 'degraded' | 'outage' = 'operational'
        if (outageCount > 0) {
          status = 'outage'
        } else if (degradedCount > 0 || avgAvailability < 99.0) {
          status = 'degraded'
        }

        return {
          id: provider.id,
          name: provider.name,
          slug: provider.slug,
          totalModels: models.length,
          operationalModels: operationalCount,
          degradedModels: degradedCount,
          outageModels: outageCount,
          avgAvailability: Math.round(avgAvailability * 10) / 10,
          avgLatency: Math.round(avgLatency),
          status
        }
      })

      // Get recent incidents (last 7 days)
      const recentIncidents = await prisma.incident.findMany({
        where: {
          startedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          model: true,
          provider: true
        },
        orderBy: { startedAt: 'desc' },
        take: 20
      })

      const formattedIncidents = recentIncidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        startedAt: incident.startedAt,
        resolvedAt: incident.resolvedAt || undefined,
        provider: incident.provider?.name,
        model: incident.model?.name
      }))

      const detailedStatus: DetailedStatus = {
        system: systemStats,
        providers: providerStatus,
        recentIncidents: formattedIncidents
      }

      // Cache for 2 minutes
      await cache.set(cacheKey, detailedStatus, 120)
      console.log(`📊 Calculated detailed status for ${providerStatus.length} providers`)
      
      return detailedStatus
    } catch (error) {
      console.error('❌ Error fetching detailed status:', error)
      throw new Error('Failed to fetch detailed status')
    }
  }

  /**
   * Get status for a specific model with optional region filtering
   */
  static async getModelStatus(modelId: string, region?: string | null) {
    const cacheKey = region ? `model:status:${modelId}:${region}` : `model:status:${modelId}`
    
    // Check cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      console.log('📦 Model status cache hit')
      return cached
    }

    try {
      // Build query with optional region filtering
      const whereClause: any = { modelId }
      if (region) {
        whereClause.region = region
      }

      const statusHistory = await prisma.modelStatus.findMany({
        where: whereClause,
        orderBy: { checkedAt: 'desc' },
        take: 50 // Last 50 status checks
      })

      if (statusHistory.length === 0) {
        return null
      }

      const current = statusHistory[0]
      const uptime = this.calculateUptime(statusHistory)

      const modelStatus = {
        current: {
          status: current.status,
          availability: current.availability,
          latencyP50: current.latencyP50,
          latencyP95: current.latencyP95,
          latencyP99: current.latencyP99,
          errorRate: current.errorRate,
          requestsPerMin: current.requestsPerMin,
          tokensPerMin: current.tokensPerMin,
          usage: current.usage,
          region: current.region,
          checkedAt: current.checkedAt
        },
        uptime: {
          last24h: uptime.last24h,
          last7d: uptime.last7d,
          last30d: uptime.last30d
        },
        history: statusHistory.map(status => ({
          status: status.status,
          availability: status.availability,
          latency: status.latencyP95,
          checkedAt: status.checkedAt
        }))
      }

      // Cache for 1 minute
      await cache.set(cacheKey, modelStatus, 60)
      
      return modelStatus
    } catch (error) {
      console.error('❌ Error fetching model status:', error)
      throw new Error('Failed to fetch model status')
    }
  }

  /**
   * Calculate uptime from status history
   */
  private static calculateUptime(statusHistory: any[]) {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const calculatePeriodUptime = (since: Date) => {
      const relevantHistory = statusHistory.filter(s => 
        new Date(s.checkedAt) >= since
      )
      
      if (relevantHistory.length === 0) return 100

      const operationalCount = relevantHistory.filter(s => 
        s.status === 'operational'
      ).length
      
      return Math.round((operationalCount / relevantHistory.length) * 100 * 10) / 10
    }

    return {
      last24h: calculatePeriodUptime(last24h),
      last7d: calculatePeriodUptime(last7d),
      last30d: calculatePeriodUptime(last30d)
    }
  }
}