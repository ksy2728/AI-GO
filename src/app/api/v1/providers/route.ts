import { NextResponse } from 'next/server'
import { ModelService } from '@/services/models.service'
import { TempDataService } from '@/services/temp-data.service'

export async function GET() {
  try {
    // Try database first, fallback to temporary data
    let providers: any[] = []
    try {
      providers = (await ModelService.getProvidersSummary()) as any[]
    } catch (error) {
      console.warn('⚠️ Database service failed, using temporary data:', error instanceof Error ? error.message : 'Unknown error')
      providers = (await TempDataService.getProvidersSummary()) as any[]
    }

    return NextResponse.json({
      providers,
      total: providers.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error fetching providers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch providers',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}