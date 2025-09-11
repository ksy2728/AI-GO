import { NextRequest, NextResponse } from 'next/server'
import { AAStatusService } from '@/services/aa-status.service'

// Node.js Runtime for reliable data fetching
// export const runtime = 'edge' // Disabled - Edge Runtime has issues with GitHub fetch

// Disable cache to always get fresh data
export const revalidate = 0 // No cache - always fetch fresh data

interface RealtimeStats {
  timestamp: string
  totalModels: number
  activeModels: number
  avgAvailability: number
  operationalModels: number
  degradedModels: number
  outageModels: number
  providers: number
  history?: TimeSeriesData[]
}

interface TimeSeriesData {
  time: string
  timestamp: number
  activeModels: number
  avgAvailability: number
  operationalModels: number
}

// Generate realistic time-series data based on actual current stats
function generateHistoricalData(currentStats: any, points: number = 20): TimeSeriesData[] {
  // Use AA service for historical data if available
  if (currentStats.isAAData) {
    return AAStatusService.generateAAHistoricalData(currentStats, points)
  }
  
  const history: TimeSeriesData[] = []
  const now = Date.now()
  
  // Use actual values from current stats - no artificial variation
  const baseActive = currentStats.activeModels || 0
  const baseAvailability = currentStats.avgAvailability || 95.0
  const baseOperational = currentStats.operationalModels || 0
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - (i * 60000) // 1 minute intervals
    
    history.push({
      time: new Date(timestamp).toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      timestamp,
      activeModels: baseActive,
      avgAvailability: Math.round(baseAvailability * 10) / 10,
      operationalModels: baseOperational
    })
  }
  
  return history
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') !== 'false'
    
    // Check if we should use AA data (default: true for AA model monitoring)
    const useAAData = searchParams.get('useAAData') !== 'false'
    
    let stats: any = {
      totalModels: 0,
      activeModels: 0,
      avgAvailability: 95.0,
      operationalModels: 0,
      degradedModels: 0,
      outageModels: 0,
      providers: 0,
      isAAData: false
    }
    
    try {
      if (useAAData) {
        // Use AA-specific stats for consistency with models page
        const aaStats = await AAStatusService.getAASystemStats()
        
        stats = {
          totalModels: aaStats.totalAAModels || 0,
          activeModels: aaStats.activeAAModels || 0,
          avgAvailability: aaStats.avgAAAvailability || 95.0,
          operationalModels: aaStats.operationalAAModels || 0,
          degradedModels: aaStats.degradedAAModels || 0,
          outageModels: aaStats.outageAAModels || 0,
          providers: aaStats.aaProviders || 0,
          isAAData: true,
          aaCategories: aaStats.aaCategories,
          avgIntelligence: aaStats.avgIntelligence,
          avgSpeed: aaStats.avgSpeed,
          avgPrice: aaStats.avgPrice,
          lastAASync: aaStats.lastAASync
        }
        
        console.log('📊 Using AA stats for realtime-stats API:', {
          total: stats.totalModels,
          active: stats.activeModels,
          operational: stats.operationalModels,
          providers: stats.providers,
          categories: Object.keys(aaStats.aaCategories || {}).length
        })
      } else {
        // Fallback to regular stats if requested
        const { StatusService } = await import('@/services/status.service')
        const systemStats = await StatusService.getSystemStats()
        
        stats = {
          totalModels: systemStats.totalModels || 0,
          activeModels: systemStats.activeModels || 0,
          avgAvailability: systemStats.avgAvailability || 95.0,
          operationalModels: systemStats.operationalModels || 0,
          degradedModels: systemStats.degradedModels || 0,
          outageModels: systemStats.outageModels || 0,
          providers: systemStats.providers || 0,
          isAAData: false
        }
        
        console.log('📊 Using database stats for realtime-stats API:', {
          total: stats.totalModels,
          active: stats.activeModels,
          operational: stats.operationalModels,
          providers: stats.providers
        })
      }
      
    } catch (dbError) {
      console.error('❌ StatusService failed:', dbError)
      // Return error response if database is unavailable
      return NextResponse.json({
        error: 'Database unavailable',
        message: 'Unable to fetch real-time statistics',
        timestamp: new Date().toISOString()
      }, {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Data-Source': 'error',
          'X-Timestamp': new Date().toISOString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }
    
    const currentStats: RealtimeStats = {
      timestamp: new Date().toISOString(),
      totalModels: stats.totalModels,
      activeModels: stats.activeModels,
      avgAvailability: Math.round(stats.avgAvailability * 10) / 10,
      operationalModels: stats.operationalModels,
      degradedModels: stats.degradedModels,
      outageModels: stats.outageModels,
      providers: stats.providers,
      // Include AA-specific data if available
      ...(stats.isAAData && {
        aaCategories: stats.aaCategories,
        avgIntelligence: stats.avgIntelligence,
        avgSpeed: stats.avgSpeed,
        avgPrice: stats.avgPrice,
        lastAASync: stats.lastAASync
      }),
      // Only include history if requested
      ...(includeHistory && { history: generateHistoricalData(stats) })
    }
    
    // Return with no-cache headers and CORS support
    return NextResponse.json(currentStats, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Data-Source': stats.isAAData ? 'artificial-analysis' : 'database',
        'X-Include-History': includeHistory ? 'true' : 'false',
        'X-Timestamp': new Date().toISOString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
    
  } catch (error) {
    console.error('Realtime stats error:', error)
    
    // Return error response on failure
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch real-time statistics',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Data-Source': 'error',
        'X-Timestamp': new Date().toISOString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
}