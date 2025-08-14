import { NextResponse } from 'next/server'
import { StatusService } from '@/services/status.service'
import { TempDataService } from '@/services/temp-data.service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'

    if (detailed) {
      // Return detailed status with provider breakdown and incidents  
      let detailedStatus
      try {
        detailedStatus = await StatusService.getDetailedStatus()
      } catch (error) {
        console.warn('⚠️ Database service failed, using basic status')
        const systemStats = await TempDataService.getSystemStats()
        detailedStatus = {
          system: systemStats,
          providers: await TempDataService.getProvidersSummary(),
          recentIncidents: []
        }
      }
      
      return NextResponse.json({
        ...detailedStatus,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Return basic system stats only
      let systemStats
      try {
        systemStats = await StatusService.getSystemStats()
      } catch (error) {
        console.warn('⚠️ Database service failed, using temporary data:', error instanceof Error ? error.message : 'Unknown error')
        systemStats = await TempDataService.getSystemStats()
      }
      
      return NextResponse.json({
        ...systemStats,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('❌ Error in status API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch system status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}