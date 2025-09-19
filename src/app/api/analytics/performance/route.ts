import { NextRequest, NextResponse } from 'next/server'

interface PerformanceMetric {
  name: string
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  url: string
  timestamp: number
  userAgent?: string
  connection?: string
}

interface PerformanceReport {
  timestamp: number
  url: string
  metrics: {
    lcp: number | null
    fid: number | null
    cls: number | null
    fcp: number | null
    ttfb: number | null
  }
  score: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  device: {
    type: 'mobile' | 'desktop'
    userAgent: string
    connection: string
    viewport: {
      width: number
      height: number
    }
  }
}

// In-memory storage for demo purposes
// In production, you'd use a database
const performanceData: PerformanceMetric[] = []
const performanceReports: PerformanceReport[] = []

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      const data = await request.json()

      // Handle individual metrics
      if (data.name && data.value !== undefined) {
        const metric: PerformanceMetric = {
          name: data.name,
          value: data.value,
          rating: data.rating,
          url: data.url || 'unknown',
          timestamp: data.timestamp || Date.now(),
          userAgent: data.userAgent,
          connection: data.connection
        }

        performanceData.push(metric)

        // Log metric in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Analytics] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating || 'unknown'})`)
        }

        return NextResponse.json({
          success: true,
          message: 'Metric recorded',
          metric: {
            name: metric.name,
            value: metric.value,
            rating: metric.rating
          }
        })
      }

      // Handle performance reports
      if (data.metrics && data.score && data.device) {
        const report: PerformanceReport = {
          timestamp: data.timestamp || Date.now(),
          url: data.url || 'unknown',
          metrics: data.metrics,
          score: data.score,
          device: data.device
        }

        performanceReports.push(report)

        // Log report in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Analytics] Performance Report:`)
          console.log(`  URL: ${report.url}`)
          console.log(`  Performance Score: ${report.score.performance}`)
          console.log(`  Core Web Vitals: LCP=${report.metrics.lcp}ms, FID=${report.metrics.fid}ms, CLS=${report.metrics.cls}`)
        }

        return NextResponse.json({
          success: true,
          message: 'Performance report recorded',
          report: {
            timestamp: report.timestamp,
            score: report.score
          }
        })
      }

      return NextResponse.json({
        success: false,
        error: 'Invalid data format'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Content-Type must be application/json'
    }, { status: 400 })

  } catch (error) {
    console.error('[Analytics] Error processing performance data:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'summary'
    const limit = parseInt(searchParams.get('limit') || '100')
    const url = searchParams.get('url')

    if (type === 'summary') {
      // Generate performance summary
      const recentMetrics = performanceData
        .filter(metric => url ? metric.url.includes(url) : true)
        .filter(metric => Date.now() - metric.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
        .slice(-limit)

      const summary = {
        totalMetrics: recentMetrics.length,
        timeRange: '24h',
        averages: {} as Record<string, number>,
        ratings: {} as Record<string, Record<string, number>>,
        trends: {} as Record<string, 'improving' | 'stable' | 'declining'>
      }

      // Calculate averages and ratings
      const metricGroups = recentMetrics.reduce((acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = []
        }
        acc[metric.name].push(metric)
        return acc
      }, {} as Record<string, PerformanceMetric[]>)

      Object.entries(metricGroups).forEach(([name, metrics]) => {
        // Average
        summary.averages[name] = Math.round(
          metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
        )

        // Rating distribution
        summary.ratings[name] = metrics.reduce((acc, m) => {
          const rating = m.rating || 'unknown'
          acc[rating] = (acc[rating] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Trend analysis (simple: compare first half to second half)
        if (metrics.length >= 4) {
          const midpoint = Math.floor(metrics.length / 2)
          const firstHalf = metrics.slice(0, midpoint)
          const secondHalf = metrics.slice(midpoint)

          const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length

          const change = (secondAvg - firstAvg) / firstAvg

          if (change < -0.05) summary.trends[name] = 'improving' // 5% improvement
          else if (change > 0.05) summary.trends[name] = 'declining' // 5% decline
          else summary.trends[name] = 'stable'
        }
      })

      return NextResponse.json({
        success: true,
        data: summary
      })
    }

    if (type === 'metrics') {
      // Return raw metrics
      const filteredMetrics = performanceData
        .filter(metric => url ? metric.url.includes(url) : true)
        .slice(-limit)
        .map(metric => ({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: metric.timestamp,
          url: metric.url
        }))

      return NextResponse.json({
        success: true,
        data: filteredMetrics
      })
    }

    if (type === 'reports') {
      // Return performance reports
      const filteredReports = performanceReports
        .filter(report => url ? report.url.includes(url) : true)
        .slice(-limit)

      return NextResponse.json({
        success: true,
        data: filteredReports
      })
    }

    if (type === 'health') {
      // Health check endpoint
      const recentReports = performanceReports
        .filter(report => Date.now() - report.timestamp < 60 * 60 * 1000) // Last hour
        .slice(-10)

      const avgPerformanceScore = recentReports.length > 0
        ? Math.round(recentReports.reduce((sum, r) => sum + r.score.performance, 0) / recentReports.length)
        : null

      const health = {
        status: avgPerformanceScore === null ? 'unknown' :
                avgPerformanceScore >= 90 ? 'excellent' :
                avgPerformanceScore >= 75 ? 'good' :
                avgPerformanceScore >= 50 ? 'fair' : 'poor',
        performanceScore: avgPerformanceScore,
        lastReport: recentReports.length > 0 ? recentReports[recentReports.length - 1].timestamp : null,
        totalReports: performanceReports.length,
        totalMetrics: performanceData.length
      }

      return NextResponse.json({
        success: true,
        data: health
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter'
    }, { status: 400 })

  } catch (error) {
    console.error('[Analytics] Error retrieving performance data:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const olderThan = searchParams.get('olderThan') // ISO string or timestamp
    const type = searchParams.get('type') || 'all'

    let deletedCount = 0

    if (type === 'all' || type === 'metrics') {
      const cutoff = olderThan ? new Date(olderThan).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days

      const originalLength = performanceData.length
      for (let i = performanceData.length - 1; i >= 0; i--) {
        if (performanceData[i].timestamp < cutoff) {
          performanceData.splice(i, 1)
        }
      }
      deletedCount += originalLength - performanceData.length
    }

    if (type === 'all' || type === 'reports') {
      const cutoff = olderThan ? new Date(olderThan).getTime() : Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days

      const originalLength = performanceReports.length
      for (let i = performanceReports.length - 1; i >= 0; i--) {
        if (performanceReports[i].timestamp < cutoff) {
          performanceReports.splice(i, 1)
        }
      }
      deletedCount += originalLength - performanceReports.length
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} old records`,
      deletedCount
    })

  } catch (error) {
    console.error('[Analytics] Error deleting performance data:', error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}